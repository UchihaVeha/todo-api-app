import Joi from 'joi';
import moment from 'moment';
import db from '../db/db';

const tagSchema = Joi.string()
  .min(2)
  .max(50)
  .regex(/^\w+$/, 'alphanumeric or _ or -');

export const fieldsSchema = Joi.object().keys({
  title: Joi.string()
    .min(4)
    .max(255)
    .required(),
  onDate: Joi.date().required(),
  isCompleted: Joi.boolean().default(false),
  tags: Joi.array()
    .items(tagSchema)
    .max(20)
    .unique()
    .default([])
});

export const idSchema = Joi.object().keys({
  id: Joi.number()
    .integer()
    .positive()
});

export const filterSchema = Joi.object().keys({
  onDate: Joi.date().required()
});

const fieldsQuery = [
  'id',
  'title',
  'on_date as onDate',
  'is_completed as isCompleted'
];
const tagsFieldQuery = () =>
  db.raw(`
    COALESCE(tags, '[]') as tags
`);

const formatDate = date => moment(date).toISOString();
const toSqlValues = values => [
  values.reduce(a => ` ${a} (?, ?::smallint),`, 'VALUES').slice(0, -1),
  values.map((v, i) => [v, i]).reduce((a, v) => a.concat(v), [])
];

const insertTodoQuery = value =>
  db
    .into('todos')
    .insert(value)
    .returning('*');

const updateTodoQuery = (id, value) =>
  db
    .table('todos')
    .update(value)
    .where('id', id)
    .returning('*');

const joinTagsQuery = (todosTagsTable = 'todos_tags', tagsTable = 'tags') =>
  db
    .select([
      'todo_id',
      db.raw(`
    json_agg(
      json_build_object('id', tag_id, 'name', name) ORDER BY sort
    ) as tags`)
    ])
    .join(tagsTable, 'tag_id', 'id')
    .from(todosTagsTable)
    .groupBy('todo_id')
    .as('tt');

const upsertTodoWithTagsQuery = (upsertTodoQuery, tags) => {
  const { sql, bindings } = upsertTodoQuery.toSQL();
  return db
    .with('upsert_todo', db.raw(sql, bindings))
    .with('new_tags_values', db.raw(...toSqlValues(tags)))
    .with(
      'inserted_tags',
      db.raw(`
      INSERT INTO tags (name) 
        SELECT name FROM new_tags_values as new_tags_values(name)
      ON CONFLICT (name) DO NOTHING  
      RETURNING id, name`)
    )
    .with(
      'all_new_tags',
      db.raw(`
      SELECT id, name from inserted_tags
        UNION ALL
      SELECT id, name FROM new_tags_values as new_tags_values(name) JOIN tags USING (name)
    `)
    )
    .with(
      'delete_todos_tags',
      db.raw(`
       DELETE FROM todos_tags
         WHERE todo_id = (SELECT id FROM upsert_todo LIMIT 1)
         AND tag_id NOT IN (SELECT id FROM all_new_tags)
     `)
    )
    .with(
      'inserted_todos_tags',
      db.raw(`
       INSERT into todos_tags (todo_id, tag_id, sort)  
         SELECT (SELECT id FROM upsert_todo LIMIT 1), id, sort 
         FROM all_new_tags JOIN new_tags_values as new_tags_values(name, sort) USING(name)
       ON CONFLICT (todo_id, tag_id) 
       DO UPDATE SET sort = excluded.sort
       RETURNING todo_id, tag_id, sort
     `)
    )
    .select([...fieldsQuery, 'tags'])
    .from('upsert_todo')
    .join(
      joinTagsQuery('inserted_todos_tags', 'all_new_tags'),
      'todo_id',
      'id'
    );
};

const upsertTodoWithoutTagsQuery = upsertTodoQuery => {
  const { sql, bindings } = upsertTodoQuery.toSQL();
  return db
    .with('upsert_todo', db.raw(sql, bindings))
    .with(
      'delete_todos_tags',
      db.raw(`
       DELETE FROM todos_tags
         WHERE todo_id = (SELECT id FROM upsert_todo LIMIT 1)
     `)
    )
    .select([...fieldsQuery, db.raw('to_json(ARRAY[]::text[]) as tags')])
    .from('upsert_todo');
};

class Todo {
  static save(data, id = null) {
    const { value } = fieldsSchema.validate(data);
    value.onDate = formatDate(value.onDate);
    const { tags, ...todo } = value;
    const query = id ? updateTodoQuery(id, todo) : insertTodoQuery(todo);
    if (!tags.length) {
      return upsertTodoWithoutTagsQuery(query);
    }
    return upsertTodoWithTagsQuery(query, tags);
  }

  static remove(id) {
    const { sql, bindings } = db
      .from('todos')
      .where('id', id)
      .returning('*')
      .delete()
      .toSQL();
    return db
      .with('deleted_todo', db.raw(sql, bindings))
      .select([...fieldsQuery, tagsFieldQuery()])
      .from('deleted_todo')
      .leftJoin(joinTagsQuery('todos_tags'), 'todo_id', 'id');
  }

  static find({ id = null, onDate = null, user_id }) {
    const query = db.table('todos');
    if (id) {
      query.where('id', id);
    } else if (onDate) {
      const d = new Date(onDate).toDateString();
      query.andWhereRaw(` 
          on_date >= date_trunc('day', to_date('${d}', 'Dy Mon DD YYYY'))
        `).andWhereRaw(`
          on_date < date_trunc('day', to_date('${d}', 'Dy Mon DD YYYY') + interval '1 day')
        `);
    }
    return query
      .andWhere({ user_id })
      .leftJoin(joinTagsQuery('todos_tags'), 'todo_id', 'id')
      .select([...fieldsQuery, tagsFieldQuery()]);
  }
}

export default Todo;
