CREATE TABLE "users" ( 
  "id" int PRIMARY KEY,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL, 
  "email" text UNIQUE NOT NULL,
  "password" text NOT NULL
);


CREATE TABLE "departments" ( 
  "code" text PRIMARY KEY,
  "name" text NOT NULL, 
  "dept_head" int
);


CREATE TABLE "dept_volunteers" (
  "dept_code" int, 
  "user_id" int, 
  PRIMARY KEY ("dept_code", "user_id")
);


CREATE TABLE "events" (
  "id" int PRIMARY KEY,
  "date" date NOT NULL,
  "dept_code" int
);


CREATE TABLE "positions" ( 
  "code" text PRIMARY KEY,
  "name" text NOT NULL
);


CREATE TABLE "events_volunteers" (
  "user_id" int, 
  "event_id" int, 
  "position_code" text NOT NULL,
  PRIMARY KEY ("user_id", "event_id")
);


CREATE TABLE "unavailable" (
  "id" int PRIMARY KEY,
  "date" date NOT NULL,
  "user_id" int
);


CREATE TABLE "user_position" (
  "user_id" int,
  "position_code" text, 
  PRIMARY KEY ("user_id", "position_code")
);


ALTER TABLE "departments" ADD
FOREIGN KEY ("dept_head") REFERENCES "users" ("id");


ALTER TABLE "dept_volunteers" ADD
FOREIGN KEY ("dept_code") REFERENCES "departments" ("code");


ALTER TABLE "dept_volunteers" ADD
FOREIGN KEY ("user_id") REFERENCES "users" ("id");


ALTER TABLE "events" ADD
FOREIGN KEY ("dept_code") REFERENCES "departments" ("code");


ALTER TABLE "events_volunteers" ADD
FOREIGN KEY ("user_id") REFERENCES "users" ("id");


ALTER TABLE "events_volunteers" ADD
FOREIGN KEY ("event_id") REFERENCES "events" ("id");


ALTER TABLE "events_volunteers" ADD
FOREIGN KEY ("position_code") REFERENCES "positions" ("code");


ALTER TABLE "unavailable" ADD
FOREIGN KEY ("user_id") REFERENCES "users" ("id");


ALTER TABLE "user_position" ADD
FOREIGN KEY ("user_id") REFERENCES "users" ("id");


ALTER TABLE "user_position" ADD
FOREIGN KEY ("position_code") REFERENCES "positions" ("code");
