import { Container, Title, Text, Paper, Code } from '@mantine/core'
import { InlineCodeHighlight, CodeHighlight } from '@mantine/code-highlight'

const sampleCode = `function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

console.log(fibonacci(10)) // 55`

function App() {
  return (
    <Container size="sm" py="xl">
      <Title order={1} mb="md">Hello, world!</Title>

      <Text mb="lg">
        This is a simple app powered by{' '}
        <InlineCodeHighlight code="React + TypeScript + Vite" />,
        styled with <InlineCodeHighlight code="Mantine" />,
        and syntax-highlighted with <InlineCodeHighlight code="Prism" />.
      </Text>

      <Paper shadow="sm" p="md" withBorder>
        <Title order={3} mb="sm">Code example</Title>
        <CodeHighlight code={sampleCode} language="ts" />
      </Paper>

      <Text ta="center" mt="xl" c="dimmed" size="sm">
        Edit <Code>src/App.tsx</Code> to get started
      </Text>
    </Container>
  )
}

export default App
