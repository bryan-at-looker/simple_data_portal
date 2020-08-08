import React, { useContext, useState } from 'react'
import styled from "styled-components";
import {ExtensionContext} from '@looker/extension-sdk-react'

import { 
  Heading, 
  Flex, 
  FlexItem,
  MenuList,
  MenuGroup,
  MenuItem,
  theme 
} from '@looker/components'
import SidebarToggle from './SidebarToggle'

const boardId = 2

const Extension = () => {
  const context = useContext(ExtensionContext)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [board, setBoard] = useState({})
  const [user, setUser] = useState({})
  const [pageHeader, setPageHeader] = useState({
    text: theme.colors.palette.white,
    background: theme.colors.palette.purple400,
    image: 'https://berlin-test-2.s3-us-west-1.amazonaws.com/spirals.png'
  })
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  const menuGroups = []

  console.log('ExtensionContext:', context)

  const getBoard = async () => {
    try {
      const boardDetails = await context.core40SDK.ok(
        context.core40SDK.board(boardId)
      )
      setBoard(boardDetails)
    } catch (error) {
      console.log('failed to get board', error)
    }
  }

  const getUser = async () => {
    try {
      const userDetails = await context.core40SDK.ok(
        context.core40SDK.me()
      )
      setUser(userDetails)
    } catch (error) {
      console.log('failed to get user', error)
    }
  }

  // TODO:
  // - set up a user attribute e.g. pbl_board to capture per-group settings
  // - search for user attribute ID by using this known name
  // - get user id
  // - user_attribute_user_values(user_id) API call to get user's page
  // - try switching pbl_board values against user, see if extension changes live
  // 

  const getBoardId = async () => {
    const id = await context.core40SDK.ok(
      context.core40SDK.all_user_attriute_group_values
    )
  }

  getBoard()
    .then(console.log('Board:', board))
    .then(console.log('Board Description:', board.description))

  getUser()
    .then(console.log('User:', user))
  
  const PageHeader = styled(Flex)`
    background-color: ${pageHeader.background};
    background-position: 100% 0;
    background-repeat: no-repeat;
    background-size: 836px 120px;
    padding: ${theme.space.large};
    background-image: url(${pageHeader.image});
    h1 {
      color: ${pageHeader.text};
    }
  `

  if (typeof board.board_sections !== 'undefined') {
    board.board_sections.forEach(board_section => {
      const group = {
        title: board_section.title,
        items: []
      }
      board_section.board_items.forEach(item => {
        group.items.push({
          title: item.title,
          url: item.url,
          icon: 'Dashboard'
        })
      })
      menuGroups.push(group)
    })
  }

  console.log('menuGroups:', menuGroups)



  return (
    <>
      <PageHeader>
        <FlexItem>
          <Heading as="h1" fontWeight='bold'>Simple Extension</Heading>
        </FlexItem>
      </PageHeader>

      <PageLayout open={sidebarOpen}>
        <LayoutSidebar>
          {sidebarOpen &&
            <MenuList>
              {menuGroups.map(group => (
                <MenuGroup label={group.title}>
                  {group.items.map(item => <MenuItem icon={item.icon}>{item.title}</MenuItem>)}
                </MenuGroup>
              ))}
            </MenuList>
          }
        </LayoutSidebar>

        <SidebarDivider open={sidebarOpen}>
          <SidebarToggle
            isOpen={sidebarOpen}
            onClick={toggleSidebar}
            headerHeigh="114px"
          />
        </SidebarDivider>

        <PageContent></PageContent>

      </PageLayout>
    </>
  )
}


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
