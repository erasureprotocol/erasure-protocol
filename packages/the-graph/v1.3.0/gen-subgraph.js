const Handlebars = require('handlebars')
const fs = require('fs')
const { ErasureV130 } = require('@erasure/abis')

const writeSubgraphConfig = async templateArgs => {
  const templateFile = fs.readFileSync('./subgraph.yaml.handlebars', 'utf8')
  const template = Handlebars.compile(templateFile)

  fs.writeFileSync('./subgraph.yaml', template(templateArgs))
}

async function main() {
  const network = process.argv[2]
  if (!network) {
    console.error('expected cli param for network')
    process.exit(1)
  }

  const args = {
    network: network,

    FeedFactory: ErasureV130.Feed_Factory[network],
    SimpleGriefingFactory: ErasureV130.SimpleGriefing_Factory[network],
    CountdownGriefingFactory: ErasureV130.CountdownGriefing_Factory[network],
    CountdownGriefingEscrowFactory:
      ErasureV130.CountdownGriefingEscrow_Factory[network],
  }

  await writeSubgraphConfig(args)
}

main()
