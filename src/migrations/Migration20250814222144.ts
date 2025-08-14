import { Migration } from '@mikro-orm/migrations';

export class Migration20250814222144 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table "apartment" ("id" serial primary key, "name" varchar(255) not null, "description" text null, "price" numeric(10,0) not null, "location" varchar(255) not null, "number_of_bedrooms" int not null, "number_of_bathrooms" int not null, "square_meters" int not null, "floor" int null, "has_elevator" boolean null, "amenities" jsonb null);'
    );

    this.addSql(
      'create table "hotel" ("id" serial primary key, "name" varchar(255) not null, "description" text null, "price" numeric(10,0) not null, "location" varchar(255) not null, "number_of_rooms" int not null, "star_rating" int not null, "amenities" jsonb null);'
    );
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "apartment" cascade;');

    this.addSql('drop table if exists "hotel" cascade;');
  }
}
