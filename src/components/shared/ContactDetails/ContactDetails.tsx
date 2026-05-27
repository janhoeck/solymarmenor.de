import { PiEnvelopeOpenLight, PiPhoneCallLight } from 'react-icons/pi'

export const ContactDetails = () => {
  return (
    <div className='flex flex-col gap-2 text-foreground'>
      <div className='flex flex-col'>
        <span className='font-bold'>Olaf und Tina Asbach</span>
        <span>Calle Fernando Dodero 12</span>
        <span>30368 Los Urrutias</span>
        <span>Murcia</span>
      </div>
      <div className='space-y-4'>
        <div className='space-y-3 text-sm'>
          <a
            href='mailto:casas.marmenor@gmx.de'
            className='flex items-center gap-3 text-foreground hover:text-primary transition-colors'
          >
            <PiEnvelopeOpenLight size={20} />
            casas.marmenor@gmx.de
          </a>
          <a
            href='tel:+34 604 482 002'
            className='flex items-center gap-3 text-foreground hover:text-primary transition-colors'
          >
            <PiPhoneCallLight size={20} />
            +34 604 482 002
          </a>
          <a
            href='tel:+49 176 47 36 7 18'
            className='flex items-center gap-3 text-foreground hover:text-primary transition-colors'
          >
            <PiPhoneCallLight size={20} />
            +49 176 47 36 7 18
          </a>
        </div>
      </div>
    </div>
  )
}
