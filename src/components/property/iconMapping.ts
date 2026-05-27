import { IconType as ReactIconType } from 'react-icons'
import { FaKitchenSet, FaMattressPillow } from 'react-icons/fa6'
import { GiClothesline, GiVacuumCleaner } from 'react-icons/gi'
import { LuMicrowave } from 'react-icons/lu'
import { LuAlarmSmoke } from 'react-icons/lu'
import { LuMaximize, LuPartyPopper, LuRefrigerator } from 'react-icons/lu'
import { MdBalcony, MdOutlineDeck, MdOutlinePets } from 'react-icons/md'
import {
  PiArrowLeft,
  PiArrowRight,
  PiBathtub,
  PiBed,
  PiCarSimple,
  PiChair,
  PiCigarette,
  PiCoffee,
  PiElevator,
  PiFireExtinguisher,
  PiHairDryer,
  PiOven,
  PiShower,
  PiSwimmingPool,
  PiTelevision,
  PiTowel,
  PiWashingMachine,
  PiWheelchair,
  PiWifiHigh,
  PiWine,
} from 'react-icons/pi'
import { RiGroupLine } from 'react-icons/ri'
import { TbAirConditioning } from 'react-icons/tb'
import { TbCooker, TbTeapot } from 'react-icons/tb'

import { IconType } from '../../types/IconType'

export const iconMapping: Record<IconType, ReactIconType> = {
  area_size: LuMaximize,
  group: RiGroupLine,
  air_conditioner: TbAirConditioning,
  baby_bed: PiBed,
  bed: PiBed,
  balcony: MdBalcony,
  barrier_free: PiWheelchair,
  elevator: PiElevator,
  bathtub: PiBathtub,
  bed_linen: FaMattressPillow,
  coffee_machine: PiCoffee,
  cooker: TbCooker,
  dishes: PiWine,
  fire_extinguisher: PiFireExtinguisher,
  freezer: LuRefrigerator,
  hairdryer: PiHairDryer,
  high_chair: PiChair,
  microwave: LuMicrowave,
  oven: PiOven,
  pots_pans: FaKitchenSet,
  refrigerator: LuRefrigerator,
  shower: PiShower,
  smoke_detector: LuAlarmSmoke,
  terrace: MdOutlineDeck,
  towels: PiTowel,
  vacuum: GiVacuumCleaner,
  washing_rack: GiClothesline,
  parking: PiCarSimple,
  tv: PiTelevision,
  wlan: PiWifiHigh,
  washing_machine: PiWashingMachine,
  pool: PiSwimmingPool,
  kettle: TbTeapot,
  party: LuPartyPopper,
  pet: MdOutlinePets,
  smoking: PiCigarette,
  checkin: PiArrowRight,
  checkout: PiArrowLeft,
}
