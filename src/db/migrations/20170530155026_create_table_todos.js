export const up = async knex => {
  await knex.schema.createTable('todos', table => {
    table.increments('id');
    table.integer('user_id').notNullable();
    table.string('title').notNullable();
    table.dateTime('on_date').notNullable();
    table.boolean('is_completed').notNullable();
    table
      .timestamp('created_at')
      .defaultTo(knex.fn.now())
      .notNullable();
    table
      .timestamp('updated_at')
      .defaultTo(knex.fn.now())
      .notNullable();
  });
};

export const down = async knex => {
  await knex.schema.dropTable('todos');
};
