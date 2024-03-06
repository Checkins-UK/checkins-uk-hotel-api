import { Controller, Post, Body , Param, HttpCode } from '@nestjs/common';
import { ZentrumhubService } from '../services/hotel.api.service';

@Controller('api/v1')
export class ZentrumhubController {
  constructor(private readonly zentrumhubService: ZentrumhubService) {}

  @Post('/hotels/content/hotelcontent/getHotelContent')
  @HttpCode(200)
  async getBasicHotelContent(@Body() reqBody: any ) {
    try {
      const result = await this.zentrumhubService.basicHotelContent(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }

  @Post('/hotels/availability')
  @HttpCode(200)
  async getHotelAvailability(@Body() reqBody: any ) {
    try {
      const result = await this.zentrumhubService.initialCallOfZentrumhub(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }

  @Post('/hotels/availability/async/:token/:resultkey')
  @HttpCode(200)
  async nextAsyncHotelData(
    @Param('token') token: string,
    @Param('resultkey') resultKey: string,
    @Body() reqBody: any
  ) {
    try {
      const result = await this.zentrumhubService.nextAsyncHotelData(token, resultKey , reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }

  @Post('/content/individualHotel/getHotelContent')
  @HttpCode(200)
  async getHotelContent(@Body() reqBody: any ) {
    try {
      const result = await this.zentrumhubService.singleHotelData(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }

  @Post('/rates/individualHotel/roomAndRates/availability/init')
  @HttpCode(200)
  async getRoomAndRates(@Body() reqBody: any ) {
    try {
      const result = await this.zentrumhubService.initRoomAndRatesToken(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }

  @Post('/rates/individualHotel/roomAndRates/availability')
  @HttpCode(200)
  async getAvailability(@Body() reqBody: any ) {
    try {
      const result = await this.zentrumhubService.priceCheckingRecommendation(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }

  @Post('/hotel/room/book')
  @HttpCode(200)
  async hotelRoomBook(@Body() reqBody: any ) {
    try {
      const result = await this.zentrumhubService.roomBookingZentrumhub(reqBody);
      return result;
    } catch (error) {
      console.error(error);
      return { hotels: [], error: error };
    }
  }
}