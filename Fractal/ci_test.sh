output=$(yarn run test)
echo "$output"
echo "$output" | grep fail && exit 1
