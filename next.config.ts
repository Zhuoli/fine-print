import type {NextConfig} from 'next'

const config: NextConfig = {
  // The offline seed + source snapshots are read from disk at runtime; ship them with the function.
  outputFileTracingIncludes: {'/api/ask': ['./seed/**/*', './sources/**/*']},
  serverExternalPackages: ['groq-js'],
}
export default config
