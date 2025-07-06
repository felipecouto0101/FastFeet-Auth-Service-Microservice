export enum UserRole {
  ADMIN = 'admin',
  DELIVERYMAN = 'deliveryman',
}

export class User {
  constructor(
    public readonly id: string,
    public readonly cpf: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role: UserRole = UserRole.DELIVERYMAN,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  static fromDeliveryMan(deliveryMan: any): User {
    return new User(
      deliveryMan.id,
      deliveryMan.cpf,
      deliveryMan.name,
      deliveryMan.email || '',
      deliveryMan.password,
      UserRole.DELIVERYMAN,
      deliveryMan.isActive ?? true,
      new Date(deliveryMan.createdAt),
      new Date(deliveryMan.updatedAt),
    );
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isDeliveryman(): boolean {
    return this.role === UserRole.DELIVERYMAN;
  }
}