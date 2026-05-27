import { FaRegStar, FaStar } from 'react-icons/fa6'

type StarRatingProps = {
  rating: number
  maxRating?: number
}

export const StarRating = (props: StarRatingProps) => {
  const { rating, maxRating = 5 } = props

  return (
    <div className='flex gap-1'>
      {Array.from({ length: maxRating }).map((_, index) => {
        const isFilled = rating >= index + 1
        return (
          <div key={index}>
            {isFilled ? (
              <FaStar className='size-5 fill-yellow-400' />
            ) : (
              <FaRegStar className='size-5 fill-yellow-400' />
            )}
          </div>
        )
      })}
    </div>
  )
}
