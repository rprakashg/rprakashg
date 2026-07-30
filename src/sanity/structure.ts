import { CaseIcon } from '@sanity/icons/Case'
import { DocumentTextIcon } from '@sanity/icons/DocumentText'
import { FolderIcon } from '@sanity/icons/Folder'
import { TagIcon } from '@sanity/icons/Tag'
import { UserIcon } from '@sanity/icons/User'
import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Profile')
        .id('profile')
        .icon(CaseIcon)
        .child(S.document().schemaType('profile').documentId('profile').title('Profile')),
      S.divider(),
      S.documentTypeListItem('post').title('Posts').icon(DocumentTextIcon),
      S.documentTypeListItem('author').title('Authors').icon(UserIcon),
      S.documentTypeListItem('category').title('Categories').icon(FolderIcon),
      S.documentTypeListItem('tag').title('Tags').icon(TagIcon),
    ])
