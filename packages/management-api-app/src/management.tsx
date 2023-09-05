import { isMgmtApiRegistered, mgmtService, ManagedPod, MgmtActions } from '@hawtio/online-management-api'
import { k8Api, k8Service } from '@hawtio/online-kubernetes-api'
import React, { useRef, useEffect, useState } from 'react'
import {
  Alert,
  Card,
  CardTitle,
  CardBody,
  Divider,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  Skeleton,
  Title,
  Masthead,
  MastheadContent,
  Label,
  Button,
} from '@patternfly/react-core'
import { InfoCircleIcon } from '@patternfly/react-icons'
import { userService } from '@hawtio/react'
import { ManagementPods } from './management-pods'

export const Management: React.FunctionComponent = () => {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>()
  const [username, setUsername] = useState('')

  const [pods, setPods] = useState<ManagedPod[]>([])

  useEffect(() => {
    setIsLoading(true)

    const checkLoading = async () => {
      const mgmtLoaded = await isMgmtApiRegistered()

      if (!mgmtLoaded) return

      setIsLoading(false)

      if (k8Api.hasError()) {
        setError(k8Api.error)
        return
      }

      if (k8Service.hasError()) {
        setError(k8Service.error)
      }

      await userService.fetchUser()
      const username = await userService.getUsername()
      setUsername(username)

      mgmtService.on(MgmtActions.UPDATED, () => {
        setPods([...mgmtService.pods]) // Use spread to ensure react updates the state
      })
    }

    checkLoading()

    timerRef.current = setTimeout(checkLoading, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Management API</CardTitle>
        <CardBody>
          <Skeleton screenreaderText='Loading...' />
        </CardBody>
      </Card>
    )
  }

  const unwrap = (error: Error): string => {
    if (!error) return 'unknown error'

    if (error.cause instanceof Error) return unwrap(error.cause)

    return error.message
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <Alert variant='danger' title={error?.message}>
            {unwrap(error)}
          </Alert>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>
        <Title headingLevel='h1'>Management API</Title>
      </CardTitle>
      <CardBody>
        <Masthead id='login-credentials'>
          <MastheadContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'stretch', width: '100%' }}>
              <Label color='green' icon={<InfoCircleIcon />}>
                {username}
              </Label>
              <Button
                variant='danger'
                ouiaId='Logout'
                onClick={() => {
                  userService.logout()
                }}
              >
                Logout
              </Button>
            </div>
          </MastheadContent>
        </Masthead>

        <Panel>
          <PanelHeader>API Properties</PanelHeader>
          <Divider />
          <PanelMain>
            <PanelMainBody>
              <ManagementPods pods={pods} />
            </PanelMainBody>
          </PanelMain>
        </Panel>

        <Divider />
      </CardBody>
    </Card>
  )
}
