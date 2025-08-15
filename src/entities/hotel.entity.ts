import { Entity, Property, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class Hotel {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'decimal' })
  price!: number;

  @Property()
  location!: string;

  @Property()
  numberOfRooms!: number;

  @Property()
  starRating!: number;

  @Property({ type: 'json', nullable: true })
  amenities?: string[];
}
