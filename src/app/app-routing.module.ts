import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { ForcePage } from './pages/force/force.page';

const routes: Routes = [
  {
    path: '',   component: ForcePage
  },
  {
    path: '**',    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      { relativeLinkResolution: 'legacy' }
    ),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
