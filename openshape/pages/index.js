export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/cad-interface',
      permanent: false,
    },
  }
}

export default function Home() {
  return null
}
