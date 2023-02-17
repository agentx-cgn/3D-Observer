import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  {
    path: '',   component: HomeComponent
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
