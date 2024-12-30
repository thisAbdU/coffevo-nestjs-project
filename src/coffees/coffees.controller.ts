import { Body, Controller, Delete, Get, InternalServerErrorException, Param, Patch, Post, Query, Req, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto/pagination-query.dto';
import { CoffeesService } from './coffees.service';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Protocol } from '../common/decorators/protocol.decorator';
import { ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { RateCoffeeDto } from './dto/rate-coffee.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoValidationPipe } from 'src/common/pipes/photo-validation/photo-validation.pipe';

@ApiTags('coffees')
@Controller({ path: 'coffees', version: '1' })
export class CoffeesController {
    constructor(
        private readonly coffeeService: CoffeesService, 
        private readonly usersService: UsersService,
    ) {}

    @Get('')
    @Roles([Role.Admin, Role.User])
    @ApiForbiddenResponse({ description: 'Forbidden.' })
    async findAll(@Protocol('https') protocol: string, @Query() paginationQuery: PaginationQueryDto) {
        return this.coffeeService.findAll(paginationQuery);
    }

    @Get('by-rate')
    @Roles([Role.Admin, Role.User])
    async findAllByRate(@Query() paginationQuery: PaginationQueryDto) {
        return this.coffeeService.findAllByRate(paginationQuery);
    }

    @Get(':id')
    @Roles([Role.Admin, Role.User])
    async findOne(@Param('id') id: string) {
        const coffee = this.coffeeService.findOne(id);
        return coffee;
    }

    @Post()
    @Roles([Role.Admin, Role.User])
    @UseInterceptors(FileInterceptor('photo'))
    async create(
        @Body() createCoffeeDto: CreateCoffeeDto,
        @UploadedFile(new PhotoValidationPipe()) file: Express.Multer.File,
        @Req() request: any,
    ) {
      const photo = file?.buffer;
      const username = request.user.username;
      const inventor = await this.usersService.findOne(username);
    
      return this.coffeeService.create(createCoffeeDto, photo, inventor);
    }

    @Patch(':id')
    @Roles([Role.Admin, Role.User])
    @UseInterceptors(FileInterceptor('photo'))
    async update(
        @Param('id') id: string, 
        @Body() updateCoffeeDto: UpdateCoffeeDto, 
        @UploadedFile(new PhotoValidationPipe()) file: Express.Multer.File,
        @Req() request: any) {

        const photo = file?.buffer;
        const username = request.user.username;
        const user = await this.usersService.findOne(username);
        
        const coffee = await this.coffeeService.findOne(id);

        if (user.role == Role.Admin) {
            return await this.coffeeService.update(id, updateCoffeeDto, photo);
        } else if (user.role == Role.User) {
            if (coffee.inventor.id == user.id) {
                return await this.coffeeService.update(id, updateCoffeeDto, photo);
            } else {
                throw new UnauthorizedException("User cannot update others' coffees");
            }
        } else {
            throw new InternalServerErrorException("Unsupported user role");
        }
    }

    @Delete(':id')
    @Roles([Role.Admin, Role.User])
    async remove(@Param('id') id:string, @Req() request: any) {

        const username = request.user.username;
        const user = await this.usersService.findOne(username);

        const coffee = await this.coffeeService.findOne(id);

        if (user.role == Role.Admin) {
            return this.coffeeService.remove(id);
        } else if (user.role == Role.User) {
            if (coffee.inventor.id == user.id) {
                return this.coffeeService.remove(id);
            } else {
                throw new UnauthorizedException("User cannot delete others' coffees");
            }
        } else {
            throw new InternalServerErrorException("Unsupported user role");
        }
    }

    @Post(':id/rate')
    @Roles([Role.Admin, Role.User])
    async rateCoffee(@Param('id') coffeeId: string, @Body() rateCoffeeDto: RateCoffeeDto, @Req() request: any) {

        const username = request.user.username;
        return await this.coffeeService.rateCoffee(coffeeId, username, rateCoffeeDto);
    }
}
