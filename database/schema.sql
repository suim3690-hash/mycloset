CREATE TABLE outfit_record (
    id           BIGINT PRIMARY KEY,
    record_date  DATE NOT NULL,
    photo_path   VARCHAR(255) NOT NULL,
    filter_type  VARCHAR(20) NOT NULL,
    memo         VARCHAR(500),
    is_main      SMALLINT DEFAULT 0 NOT NULL,
    item_tags    VARCHAR(500),
    look_category VARCHAR(100),
    location     VARCHAR(100),
    like_count   INTEGER DEFAULT 0 NOT NULL,
    is_liked     SMALLINT DEFAULT 0 NOT NULL,
    is_saved     SMALLINT DEFAULT 0 NOT NULL,
    created_at   TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE outfit_record_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE style_analysis (
    id              BIGINT PRIMARY KEY,
    record_date     DATE NOT NULL UNIQUE,
    style_breakdown VARCHAR(1000),
    selected_tags   VARCHAR(500),
    reason_tags     VARCHAR(500),
    fact_bomb       VARCHAR(2000),
    created_at      TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE style_analysis_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE outfit_comment (
    id          BIGINT PRIMARY KEY,
    outfit_id   BIGINT NOT NULL,
    content     VARCHAR(500) NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE outfit_comment_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE fact_bomb_chat (
    id           BIGINT PRIMARY KEY,
    record_date  DATE NOT NULL,
    role         VARCHAR(20) NOT NULL,
    content      VARCHAR(1000) NOT NULL,
    created_at   TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE fact_bomb_chat_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE magazine_article (
    id          BIGINT PRIMARY KEY,
    category    VARCHAR(20) NOT NULL,
    title       VARCHAR(300) NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_url  VARCHAR(500) NOT NULL,
    image_url   VARCHAR(500),
    summary_ko  VARCHAR(1000),
    created_at  TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE magazine_article_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE time_capsule (
    id           BIGINT PRIMARY KEY,
    record_date  DATE NOT NULL,
    message      VARCHAR(500) NOT NULL,
    reveal_date  DATE NOT NULL,
    opened       SMALLINT DEFAULT 0 NOT NULL,
    created_at   TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE time_capsule_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE app_user (
    id            BIGINT PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(50) NOT NULL,
    bio           VARCHAR(100),
    avatar_path   VARCHAR(255),
    cover_path    VARCHAR(255),
    created_at    TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE app_user_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE user_session (
    token       VARCHAR(64) PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL
);

CREATE TABLE look_room_member (
    id            BIGINT PRIMARY KEY,
    look_category VARCHAR(20) NOT NULL,
    user_id       BIGINT NOT NULL,
    joined_at     TIMESTAMP DEFAULT now() NOT NULL,
    UNIQUE (look_category, user_id)
);

CREATE SEQUENCE look_room_member_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE look_room_message (
    id            BIGINT PRIMARY KEY,
    look_category VARCHAR(20) NOT NULL,
    user_id       BIGINT NOT NULL,
    content       VARCHAR(500) NOT NULL,
    created_at    TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE look_room_message_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE style_profile (
    id              BIGINT PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE,
    gender          VARCHAR(20),
    height_cm       INTEGER,
    weight_kg       INTEGER,
    preferred_looks VARCHAR(300),
    recommendation  VARCHAR(2000),
    updated_at      TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE style_profile_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE wardrobe_item (
    id          BIGINT PRIMARY KEY,
    outfit_id   BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    items_json  VARCHAR(1000) NOT NULL,
    created_at  TIMESTAMP DEFAULT now() NOT NULL
);

CREATE SEQUENCE wardrobe_item_seq START WITH 1 INCREMENT BY 1;
