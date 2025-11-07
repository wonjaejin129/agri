/* ===============================================
   공용 DB 초기화 스크립트 (웹/앱 동일 계정 사용)
   - testdb 생성 (없으면)
   - users, favorites 테이블 생성/정렬
   - utf8mb4 기본 세팅
   =============================================== */

-- 0) 기본 세션 설정 (선택)
SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- 1) 데이터베이스
CREATE DATABASE IF NOT EXISTS testdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE testdb;

-- 2) users 테이블 (bcrypt 해시 저장 가정)
--    * email은 소문자로만 관리 권장(서버에서 toLowerCase 처리)
--    * password 길이: bcrypt 해시(60자 이상) 저장 가능하도록 100자로 지정
CREATE TABLE IF NOT EXISTS users (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(190)  NOT NULL,
  password     VARCHAR(100)  NOT NULL,
  name         VARCHAR(100)  NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) favorites 테이블
--    * 사용자 삭제 시 즐겨찾기도 함께 삭제되도록 ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS favorites (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  item_name   VARCHAR(100)    NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- (선택) 성능을 위한 인덱스
CREATE INDEX idx_favorites_user_id ON favorites (user_id);

-- ===============================================
-- [옵션] 기존 테이블이 있었는데 스키마가 다를 수 있을 때의 점진적 정리
--  아래 ALTER들은 필요한 경우에만 성공합니다(없으면 무시 or 에러 무시하고 개별 실행).
-- ===============================================
/*
-- users.password 길이가 짧다면(예: 50 이하면) 늘리기
ALTER TABLE users MODIFY COLUMN password VARCHAR(100) NOT NULL;

-- users.email 유니크 보장
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- favorites 외래키/ON DELETE CASCADE 보장
ALTER TABLE favorites
  DROP FOREIGN KEY fk_favorites_user,
  ADD CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 전체 문자셋/콜레이션 정렬
ALTER TABLE users     CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE favorites CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
*/

-- ===============================================
-- [참고] 초기 확인
-- SELECT * FROM users LIMIT 10;
-- SHOW CREATE TABLE users\G
-- SHOW CREATE TABLE favorites\G

