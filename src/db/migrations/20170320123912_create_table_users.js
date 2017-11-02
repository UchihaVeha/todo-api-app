export const up = async knex => {
  await knex.schema.createTable('users', table => {
    table.increments('id');
    table
      .string('email')
      .unique()
      .notNullable();
    table.string('password_hash').notNullable();
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
    CREATE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
    $$ language 'plpgsql';
    CREATE TRIGGER users_updated_at
      BEFORE UPDATE
      ON users
      FOR EACH ROW
      EXECUTE PROCEDURE update_updated_at_column(); 
  `);
};

export const down = async knex => {
  await knex.raw(`
   DROP TRIGGER users_updated_at ON users;
   DROP FUNCTION update_updated_at_column();   
  `);
  await knex.schema.dropTable('users');
};
