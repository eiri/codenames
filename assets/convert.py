with open('ACB_codenames.txt', 'r') as file:
    lines = [l.strip().lower() for l in file.read().split(', ')]

lines.sort()

print('export default {')
print('  words = [')
for line in lines:
    print(f'    "{line}",')
print('  ]')
print('}')
