// One-off: turns the two bare prices into a pricing block.
// The season periods are not new information: BookItCard hard-coded the off
// season as months [9,10,11,0,1,2] and the messages spell it out as
// "Oktober - März" / "April - September".
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const DIR = path.join(process.cwd(), 'src/data/properties')

for (const id of ['apartment', 'house']) {
  const file = path.join(DIR, `${id}.json`)
  const data = JSON.parse(readFileSync(file, 'utf-8'))
  const { perNight, cleaning } = data.price

  delete data.price
  data.pricing = {
    currency: 'EUR',
    rates: [
      { season: 'main', pricePerNight: perNight.mainSeason, periods: [{ from: '04-01', to: '09-30' }] },
      { season: 'off', pricePerNight: perNight.offSeason, periods: [{ from: '10-01', to: '03-31' }] },
    ],
    fees: cleaning ? [{ type: 'cleaning', amount: cleaning, basis: 'perStay' }] : [],
    minNights: null,
  }

  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
  console.log(`${id}: main ${perNight.mainSeason} €, off ${perNight.offSeason} €`)
}
