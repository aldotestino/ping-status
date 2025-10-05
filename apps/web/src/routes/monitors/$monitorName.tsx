import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/monitors/$monitorName')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/monitors/$monitorName"!</div>
}
