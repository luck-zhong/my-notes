import React from 'react';
import {Redirect} from '@docusaurus/router';
import {useLatestVersion} from '@docusaurus/plugin-content-docs/client';

export default function Home(): React.ReactNode {
  const docsVersion = useLatestVersion(undefined);
  const mainDoc =
    docsVersion.docs.find((doc) => doc.id === docsVersion.mainDocId) ??
    docsVersion.docs[0];

  return <Redirect to={mainDoc.path} />;
}
