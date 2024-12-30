import { Coffee } from '../../coffees/entities/coffee.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Rate } from '../../coffees/entities/rate.entity';

export enum Role {
  User = 'user',
  Admin = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  username: string;

  @Exclude()
  @Column({ nullable: false })
  password: string;

  @Column({ nullable: false, enum: Role, default: Role.User })
  role: Role;

  @OneToMany((type) => Coffee, (coffee) => coffee.inventor)
  coffees: Coffee[];

  @OneToMany((type) => Rate, (rate) => rate.author)
  rates: Rate[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
