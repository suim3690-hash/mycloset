package com.mycloset.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigration.class);

    private static final String[] STATEMENTS = {
            "ALTER TABLE outfit_record ADD COLUMN IF NOT EXISTS user_id BIGINT",
            "ALTER TABLE outfit_record ADD COLUMN IF NOT EXISTS is_shared SMALLINT DEFAULT 0 NOT NULL",
            "ALTER TABLE app_user ADD COLUMN IF NOT EXISTS cover_path VARCHAR(255)",
            "CREATE SEQUENCE IF NOT EXISTS wardrobe_item_seq START WITH 1 INCREMENT BY 1",
            """
            CREATE TABLE IF NOT EXISTS wardrobe_item (
                id          BIGINT PRIMARY KEY,
                outfit_id   BIGINT NOT NULL,
                user_id     BIGINT NOT NULL,
                items_json  VARCHAR(1000) NOT NULL,
                created_at  TIMESTAMP DEFAULT now() NOT NULL
            )
            """,
    };

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String statement : STATEMENTS) {
            try {
                jdbcTemplate.execute(statement);
                log.info("Schema migration applied: {}", statement);
            } catch (Exception e) {
                log.warn("Schema migration skipped ({}): {}", statement, e.getMessage());
            }
        }
    }
}
