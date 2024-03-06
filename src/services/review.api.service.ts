import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ReviewService {

  async reviewsForTheHotel(reqBody: any) {

    try {
        const { city, hotelName } = reqBody;
        
        const response = await axios.get(
            `${process.env.TRIP_ADVISOR_API_URL}/api/get-locations?hotel=${hotelName}&city=${city}`
        );

        if (response.data.data.length === 0) {
            throw new HttpException('There is no matching hotels for hotel names that provide by the city and hotel name', HttpStatus.NOT_FOUND);
          }

        const firstResultID = response.data.data[0].location_id;
          
        try {
            const response = await axios.get(
              `${process.env.TRIP_ADVISOR_API_URL}/api/get-reviews/${firstResultID}`
            );
      
            return response.data;
          } catch (err) {
            console.log(err);
            throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR);
          }
      
    } catch (error) {
      console.error(error);
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async reviewsForTheHotelOneCall(reqBody: any) {

    try {

        const { city, hotelName } = reqBody;

        const response = await axios.get(
            `https://reviews.checkins.ai/hotel_reviews?hotel=${hotelName}, ${city}`
          );

          // if (response.data.length === 0) {
          //   throw new HttpException('There is no matching hotels for hotel names that provide by the city and hotel name', HttpStatus.NOT_FOUND);
          // }

          return response.data;
      
      
    } catch (error) {
      console.error(error);
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
