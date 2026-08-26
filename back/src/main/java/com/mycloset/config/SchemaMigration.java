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
