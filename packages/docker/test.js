const fs = require('fs')

main = () => {
  fs.writeFileSync('/data/config.json', JSON.stringify({ foo: 'bar' }))
}

main()
