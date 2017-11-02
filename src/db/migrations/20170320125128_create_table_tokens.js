export const up = async knex => {
  await knex.schema.createTable('tokens', table => {
    table.increments('id');
    table.integer('user_id').notNullable();
    table.string('refresh_token').notNullable();
    table
      .timestamp('created_at')
      .defaultTo(knex.fn.now())
      .notNullable();
    table
      .timestamp('updated_at')
      .defaultTo(knex.fn.now())
      .notNullable();
  });
  await knex.raw(`
    CREATE TRIGGER tokens_updated_at
      BEFORE UPDATE
      ON tokens
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column(); 
  `);
};

export const down = async knex => {
  await knex.raw(`
   DROP TRIGGER tokens_updated_at ON tokens;  
  `);
  await knex.schema.dropTable('tokens');
};
