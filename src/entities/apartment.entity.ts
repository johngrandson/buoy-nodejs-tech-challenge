import { Entity, Property, PrimaryKey } from '@mikro-orm/core';

@Entity()
export class Apartment {
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
  numberOfBedrooms!: number;

  @Property()
  numberOfBathrooms!: number;

  @Property()
  squareMeters!: number;

  @Property({ nullable: true })
  floor?: number;

  @Property({ nullable: true })
  hasElevator?: boolean;

  @Property({ type: 'json', nullable: true })
  amenities?: string[];
}
