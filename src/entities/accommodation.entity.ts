import { Entity, Property, PrimaryKey, OneToMany, Collection } from '@mikro-orm/core';
import { Booking } from './booking.entity';

@Entity({
  discriminatorColumn: 'type',
  discriminatorMap: {
    hotel: 'Hotel',
    apartment: 'Apartment',
  },
  abstract: true,
})
export abstract class Accommodation {
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
  type!: 'hotel' | 'apartment';

  @Property({ type: 'json', nullable: true })
  amenities?: string[];

  @OneToMany(() => Booking, booking => booking.accommodation)
  bookings = new Collection<Booking>(this);
}
