/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2020 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import React, { useContext, useState, useEffect } from 'react'
import { Switch, Route, Link, useHistory, useLocation } from 'react-router-dom'
import styled from "styled-components";
import qs from 'query-string';
import { ExtensionContext } from '@looker/extension-sdk-react'
import { EmbedDashboard } from './EmbedDashboard'
import { EmbedLook } from './EmbedLook'

import { 
  Heading, 
  Flex, 
  FlexItem,
  MenuList,
  MenuGroup,
  MenuItem,
  Spinner,
  theme 
} from '@looker/components'
import SidebarToggle from './SidebarToggle'


let headerTitle = 'Looker Data Platform'
let headerColor = theme.colors.palette.white
let headerBackground = theme.colors.palette.purple400
let headerImage = 'https://storage.googleapis.com/jonwalls_demo/logo.png'
let configUrl = ''

const Extension = ( { route, routeState } ) => {
  const context = useContext(ExtensionContext)
  const sdk = context.core40SDK
  let history = useHistory();
  let location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [boardId, setBoardId] = useState()
  const [filters, setFilters] = useState(qs.parse(location.search))
  const [board, setBoard] = useState({})
  const [user, setUser] = useState({})
  const [renderBoard, setRenderBoard] = useState(false)
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const menuGroups = [];

  useEffect(()=>{
    getUser();
  }, [])

  useEffect(()=>{
    if (user && user.id) {
      getBoardId();
    }
  }, [user])

  useEffect(()=>{
    if (boardId) {
      getBoard();
    }
  }, [boardId])

  useEffect(()=>{
    if (filters) {
      history.push({
        pathname: location.pathname,
        search: qs.stringify(filters)
      })
    }
  }, [filters])

  const getUser = async () => {
    try {
      const userDetails = await sdk.ok(
        sdk.me()
      )
      setUser(userDetails)
    } catch (error) {
      // console.log('failed to get user', error)
    }
  }

  const getBoardId = async () => {
    let portalBoardAttributeId = null
    try {
      const userAttributes = await sdk.ok(
        sdk.all_user_attributes({fields: ['id', 'name']})
      )
      portalBoardAttributeId = userAttributes.find(attr => attr.name === 'portal_board').id
      // console.log('portalBoardAttributeId', portalBoardAttributeId)
    } catch (error) {
      // console.log('failed to get id of portal_board attribute', error)
    }
    
    if (portalBoardAttributeId) {
      try {
        const attributeValue = await sdk.ok(
          sdk.user_attribute_user_values({
            user_id: user.id,
            user_attribute_ids: [portalBoardAttributeId],
          })
        )
        // console.log('attributeValue', attributeValue)
        if (attributeValue && attributeValue.length && attributeValue[0].value ) {
          setBoardId(parseInt(attributeValue[0].value))
        }
      } catch (error) {
        // console.log('failed to get id of portal_board attribute', error)
      }
    }
  }

  const getBoard = async () => {
    try {
      const boardDetails = await sdk.ok(
        sdk.board(boardId)
      )
      setBoard(boardDetails)
      setRenderBoard(true)
    } catch (error) {
      // console.log('failed to get board', error)
      setRenderBoard(true)
    }
  }

  if (board.title) {
    headerTitle = board.title
  }

  const descriptionLines = board.description?.split('\n')
  // console.log('descriptionLines', descriptionLines)

  descriptionLines?.forEach(line => {
    var tags = line.split(':')
    if (tags.length === 2) {
      switch(tags[0]) {
        case 'color':
          headerColor = tags[1]
          break
        case 'background':
          headerBackground = tags[1]
          break
        case 'image':
          headerImage = tags[1]
          break
        case 'config':
          configUrl = tags[1]
          break
      }
    }
  })
  
  board.board_sections?.forEach((board_section, i) => {
    const group = {
      key: i,
      title: board_section.title,
      items: []
    }
    const icons = board_section.description.split(',')
    board_section.board_items.forEach((item, j) => {
      group.items.push({
        key: j,
        title: item.title,
        type: item.url.split('/')[1],
        url: item.url,
        icon: icons[j] ? icons[j] : 'Dashboard'
      })
    })
    menuGroups.push(group)
  })

  // console.log('menuGroups:', menuGroups)

  if (renderBoard) {
    return (
      <>
        <PageHeader
            color={headerColor} 
            backgroundColor={headerBackground}
        >
          <FlexItem width="40%">
            <Heading as="h1" fontWeight='bold'>{headerTitle}</Heading>
          </FlexItem>
          <FlexItem>
            <img src={headerImage} alt="logo" height="50px" />
          </FlexItem>
          <FlexItem width="40%"></FlexItem>
        </PageHeader>
  
        <PageLayout open={sidebarOpen}>
          <LayoutSidebar>
            {sidebarOpen &&
              <MenuList>
                {menuGroups.map(group => (
                  <MenuGroup key={group.key} label={group.title}>
                    {group.items.map(item => {
                      return (
                      <Link 
                        key={item.key}  
                        to={{
                          pathname: item.url, 
                          search: location.search
                        }}
                      >
                        <MenuItem 
                          current={(location.pathname===item.url) ? true : false}
                          icon={item.icon}
                        >{item.title}</MenuItem>
                      </Link>
                      )}
                    )}
                  </MenuGroup>
                ))}
              </MenuList>
            }
          </LayoutSidebar>
  
          <SidebarDivider open={sidebarOpen}>
            <SidebarToggle
              isOpen={sidebarOpen}
              onClick={toggleSidebar}
              headerHeight="80px"
            />
          </SidebarDivider>
  
          <PageContent>
            <Switch>
              <Route path='/dashboards-next/:ref' render={props => 
                <EmbedDashboard 
                  id={props.match.params.ref} 
                  type="next" 
                  {...{filters, setFilters}}
                />
              } />
              <Route path='/dashboards/:ref' render={props => 
                <EmbedDashboard id={props.match.params.ref} 
                  type="legacy" 
                  {...{filters, setFilters}}
                />
              } />
              <Route path='/looks/:ref' render={props => 
                <EmbedLook 
                  id={props.match.params.ref} 
                  {...{filters, setFilters}}
                />
              } />
              <Route>
                <div>Landing Page</div>
              </Route>
            </Switch>
          </PageContent>
  
        </PageLayout>
      </>
    )
  } else {
    return (
      <Flex width='100%' height='90%' alignItems='center' justifyContent='center'>
        <Spinner color='black' />
      </Flex>
    )
  }
  
}


const PageHeader = styled(Flex)`
  justify-content: space-between;
  background-color: ${props => props.backgroundColor};
  background-position: 100% 0;
  background-repeat: no-repeat;
  background-size: 836px 80px;
  padding: ${theme.space.large};
  h1 {
    color: ${props => props.color};
  }
`

const PageLayout = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: ${props =>
    props.open ? "16.625rem 0 1fr" : "1.5rem 0 1fr"};
  grid-template-areas: "sidebar divider main";
  position: relative;
`

const PageContent = styled.div`
  grid-area: main;
  position: relative;
`

const LayoutSidebar = styled.aside`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16.625rem;
  grid-area: sidebar;
  z-index: 0;
`

const SidebarDivider = styled.div`
  transition: border 0.3s;
  border-left: 1px solid
    ${props =>
      props.open ? theme.colors.palette.charcoal200 : "transparent"};
  grid-area: divider;
  overflow: visible;
  position: relative;
  &:hover {
    border-left: 1px solid
      ${props =>
        props.open
          ? theme.colors.palette.charcoal300
          : theme.colors.palette.charcoal200};
  }
`

export default Extension
