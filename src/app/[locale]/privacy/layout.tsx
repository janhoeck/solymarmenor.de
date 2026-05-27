import { generateCanonicalMetadata } from '@/lib/metadata'

type Params = Promise<{ locale: string }>

type Props = {
  params: Params
}

export const generateMetadata = async (props: Props) => {
  const { locale } = await props.params
  return generateCanonicalMetadata(locale, '/privacy')
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
