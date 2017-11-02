export const up = async knex => {
  await knex.schema.createTable('todos_tags', table => {
    table
      .integer('todo_id')
      .references('id')
      .inTable('todos')
      .onDelete('CASCADE');
    table
      .integer('tag_id')
      .references('id')
      .inTable('tags');
    table.specificType('sort', 'smallint').notNullable();
    table.primary(['todo_id', 'tag_id']);
    table
      .timestamp('created_at')
      .defaultTo(knex.fn.now())
      .notNullable();
  });
};

export const down = async knex => {
  await knex.schema.dropTable('todos_tags');
};
