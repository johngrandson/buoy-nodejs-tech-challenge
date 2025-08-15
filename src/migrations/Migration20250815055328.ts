import { Migration } from '@mikro-orm/migrations';

export class Migration20250815055328 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "accommodation" add column "type" varchar(255) not null, add column "amenities" jsonb null, add column "number_of_rooms" int null, add column "star_rating" int null, add column "number_of_bedrooms" int null, add column "number_of_bathrooms" int null, add column "square_meters" int null, add column "floor" int null, add column "has_elevator" boolean null;');
    this.addSql('create index "accommodation_type_index" on "accommodation" ("type");');
  }

  async down(): Promise<void> {
    this.addSql('drop index "accommodation_type_index";');
    this.addSql('alter table "accommodation" drop column "type";');
    this.addSql('alter table "accommodation" drop column "amenities";');
    this.addSql('alter table "accommodation" drop column "number_of_rooms";');
    this.addSql('alter table "accommodation" drop column "star_rating";');
    this.addSql('alter table "accommodation" drop column "number_of_bedrooms";');
    this.addSql('alter table "accommodation" drop column "number_of_bathrooms";');
    this.addSql('alter table "accommodation" drop column "square_meters";');
    this.addSql('alter table "accommodation" drop column "floor";');
    this.addSql('alter table "accommodation" drop column "has_elevator";');
  }

}
