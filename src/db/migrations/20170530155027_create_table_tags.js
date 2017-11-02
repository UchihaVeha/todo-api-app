export const up = async knex => {
  await knex.schema.createTable('tags', table => {
    table.increments('id');
    table
      .varchar('name')
      .notNullable()
      .unique();
    table
      .timestamp('created_at')
      .defaultTo(knex.fn.now())
      .notNullable();
  });
};

export const down = async knex => {
  await knex.schema.dropTable('tags');
};
