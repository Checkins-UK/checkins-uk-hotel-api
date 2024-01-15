import { Controller, Post, Body } from '@nestjs/common';
import { ReviewService } from '../services/review.api.service';

@Controller('api/v1')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('/reviews')
  async getHotelAvailability(@Body() reqBody: any ) {
    try {
      const result = await this.reviewService.reviewsForTheHotel(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { reviews: [], error: 'There is no matching hotels for hotel names that provide by the city and hotel name' };
    }
  }

  @Post('/reviews/onecall')
  async getHotelAvailabilityRH(@Body() reqBody: any ) {
    try {
      const result = await this.reviewService.reviewsForTheHotelOneCall(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { reviews: [], error: 'There is no matching hotels for hotel names that provide by the city and hotel name' };
    }
  }

 
}