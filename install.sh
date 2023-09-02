#!/bin/bash

# Check if pre-commit hook exists
if [ ! -f .git/hooks/pre-commit ]; then
  echo "Creating pre-commit hook..."
  echo "#!/bin/bash" > .git/hooks/pre-commit
  echo "npm run check-types" >> .git/hooks/pre-commit
  chmod +x .git/hooks/pre-commit
  echo -e "Done creating pre-commit hook.\n\n"
fi