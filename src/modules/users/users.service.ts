import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from './dto/createUser.dto';
import { UsersRepository } from './users.repositories';
import { LoginUserDto } from './dto/login-user.dto';
import { InvalidCredentialsException } from 'src/common/exceptions/InvalidCredentialsException';
import { UserNotFoundException } from 'src/common/exceptions/UserNotFoundException';
import { Users } from './entities/users.entities';
import { EmailAlreadyExistsException } from 'src/common/exceptions/EmailAlreadyExistsException';
import { InternalServerException } from 'src/common/exceptions/InternalServerException';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class UserService {
  private readonly bcryptSalt: string;

  constructor(private readonly userRepository: UsersRepository) {
    this.bcryptSalt = bcrypt.genSaltSync(10);
  }

  async create(createUserData: CreateUserDto): Promise<Users> {
    const isPresent = await this.userRepository.findUser(createUserData.email);
    if (isPresent) throw new EmailAlreadyExistsException(createUserData.email);

    const { password } = createUserData;

    const hashPassword = await bcrypt.hash(password, this.bcryptSalt);

    return this.userRepository.create({
      ...createUserData,
      password: hashPassword,
    });
  }

  async login(loginUser: LoginUserDto): Promise<string> {
    const userData = await this.userRepository.findUser(loginUser.email);
    if (!userData || !userData.email || !userData.password) {
      throw new UserNotFoundException(loginUser.email);
    }
    if (!bcrypt.compareSync(loginUser.password, userData.password)) {
      throw new InvalidCredentialsException();
    }

    const token = this.userRepository.createToken(userData);
    return token;
  }

  async profile(email: string): Promise<any> {
    return await this.userRepository.fetchUser(email);
  }

  async assignRole(roleName: string, userEmail: string): Promise<Users> {
    const userAssignedRole = await this.userRepository.assignRole(
      userEmail,
      roleName,
    );
    if (!userAssignedRole) {
      throw new InternalServerException('Role was not assigned');
    }

    return userAssignedRole;
  }
}
