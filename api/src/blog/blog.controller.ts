import { Body, Controller, Get, Delete, Param, Post, Put, Patch } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';


@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  create(@Body() dto: CreatePostDto) {
    return this.blogService.create(dto);
  }

  @Get('admin')
  findAllAdmin() {
    return this.blogService.findAllAdmin();
  }

  // ✅ NUEVO: get por id (admin)
  @Get('admin/:id')
  findByIdAdmin(@Param('id') id: string) {
    return this.blogService.findByIdAdmin(id);
  }

  // ✅ NUEVO: update
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
remove(@Param('id') id: string) {
  return this.blogService.remove(id);
}


  @Patch(':id/featured')
setFeatured(@Param('id') id: string) {
  return this.blogService.setFeatured(id);
}



  @Get()
  findPublic() {
    return this.blogService.findPublic();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findPublicBySlug(slug);
  }

  
}
