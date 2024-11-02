<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar class="full-width">

      <btn-cond v-if="session.ok && !session.mini && (session.ral !== 3)"
        icon="menu" round color="none">
        <q-menu v-model="ui.menug" max-height="90vh" class="sombre1 text-white">
          <menu-accueil menu/>
        </q-menu>
      </btn-cond>

      <btn-cond :disable="!aHome" flat icon="home"
        :color="aHome ? 'green-5' : 'grey'" @ok="gotoAccueilLogin()"/>

      <btn-cond :disable="!ui.pageback || (ui.page === 'accueil')" icon="arrow_back" round @ok="ui.gotoBack()"/>

      <btn-cond v-if="session.ok && !session.avion && !session.estAdmin" 
        :color="session.statusPushIC.c" :icon="session.statusPushIC.ic" @ok="ui.oD('sync', 'a')"/>

      <btn-cond v-if="!session.ok" 
        :color="session.statusPermIC.c" :icon="session.statusPermIC.ic"/>

      <!-- Notifications -->
      <notif-icon v-if="session.status === 2" class="q-ml-xs" 
        :alire="session.alire && (session.ntfIco !== 0)" 
        :niv="session.ntfIco" 
        @click="clickNotif"/>
      
      <!-- Test du look des icones de notification
      <notif-icon v-if="session.status === 2" class="q-ml-xs" alire :niv="1"/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="2"/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" alire :niv="3"/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="4"/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="5"/> 
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="6"/> 
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="7"/> 
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="8"/>
      -->

      <!-- Suppression de compte proche -->
      <q-avatar class="cursor-pointer q-ml-xs" 
        v-if="session.ok && session.compte && session.compte.alerteDlv" @click="infoSession()"
        size="sm" square>
        <img src="~assets/zombi.png">
        <q-tooltip>{{$t('MLAcptz', session.compte.nbj, {count: session.compte.nbj})}}</q-tooltip>
      </q-avatar>

      <!-- Presse papier -->
      <btn-cond v-if="session.ok" icon="content_paste" round 
        @ok="ui.oD('pressepapier', 'a')">
        <q-tooltip>{{$t('MLApp')}}</q-tooltip>
      </btn-cond>

      <q-toolbar-title>
        <div style="position:relative">
          <div class="titre-lg text-right full-width">{{titrePage}}</div>
          <div v-if="config.nouvelleVersion" @click="ui.oD('reload', 'a')" 
            style="position:absolute;top:-4px;left:0"
            class="row cursor-pointer items-center bg-negative q-px-xs">
            <div class="titre-md text-bold text-white q-mr-sm">{{$t('RLnvver')}}</div>
            <q-icon name="system_update" size="md" color="white"/>
          </div>
        </div>
      </q-toolbar-title>

      <btn-cond v-if="session.ok && ui.aUnFiltre" 
        color="warning" round icon="search" @ok="ui.ouvrFiltre">
        <q-tooltip>{{$t('MLAfiltre')}}</q-tooltip>
      </btn-cond>

      <bouton-help :page="'page_' + ui.page"/>

      <!-- Déconnexion -->
      <btn-cond v-if="session.status > 1" color="warning" icon="logout" 
        @ok="discon" round>
        <q-tooltip style="height:1.2rem">{{$t('MLAdrc')}}</q-tooltip>
      </btn-cond>

      <q-page-sticky v-if="session.signalOp" position="top" :offset="offset"
        style="z-index:1000!important">
        <btn-cond round color="warning" icon="wifi" padding="0"/>
      </q-page-sticky>

    </q-toolbar>

    <q-toolbar v-if="ui.page === 'compta'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <btn-cond icon="refresh" @ok="session.reloadCompta()"/>
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="notif" :label="$t('PNCntf')" @click="ui.setTab('notif')"/>
        <q-tab name="compta" :label="$t('PNCabo')" @click="ui.setTab('compta')"/>
        <q-tab v-if="session.estComptable || session.compte.estA"
          name="credits" :label="$t('PNCcre')" @click="ui.setTab('credits')"/>
        <q-tab v-if="!session.estComptable" name="chats" :label="$t('PNCurg')" @click="ui.setTab('chats')"/>
      </q-tabs>
      <btn-cond v-if="ui.pagetab==='notif' && session.alire" class="col-auto q-px-sm" 
        color="warning" icon="check" :label="$t('jailu')" 
        cond="cEdit" @ok="jailu"/>
    </q-toolbar>

    <q-toolbar v-if="ui.page === 'groupe'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="groupe" :label="$t('ACtgr')" @click="ui.setTab('groupe')"/>
        <q-tab name="membres" :label="$t('ACtmb')" @click="ui.setTab('membres')"/>
      </q-tabs>
    </q-toolbar>

  </q-header>

  <q-footer>
    <q-toolbar class="sombre overflow-hidden">
      <!--bouton-help page="DOCpg"/-->

      <bouton-langue style="position:relative;top:2px;"/>

      <!-- Dark ou clair -->
      <btn-cond icon="contrast" round @ok="$q.dark.toggle()" color="none">
        <q-tooltip>{{$t('clairfonce')}}</q-tooltip>
      </btn-cond>

      <!-- Outils et tests -->
      <btn-cond icon="settings" round @ok="ui.oD('outilsTests', 'a')">
        <q-tooltip>{{$t('MLAout')}}</q-tooltip>
      </btn-cond>

      <q-toolbar-title class="row justify-end items-center titre-md text-right q-mx-xs">
        <icon-mode class="cursor-none"/>
        <img v-if="session.ok" :src="people.getCV(session.compteId).photo" 
          height="28" width="28" class="q-pa-none q-mr-sm img"/>
        <btn-cond v-if="session.oad" round padding="none sm" 
          class="q-mr-xs" :label="session.oad"/>
        <span v-if="session.ok" class="titre-lg">{{people.getCV(session.compteId).nom}}</span>
        <span v-else class="titre-md text-italic cursor-none">{{$t('MLAsfer')}}</span>
        <span v-if="session.org" class="q-ml-md titre-md">[{{session.org}}]</span>
      </q-toolbar-title>

    </q-toolbar>
  </q-footer>

  <q-drawer v-model="ui.pfiltre" side="right" elevated bordered persistent
    :width="250" :breakpoint="ui.seuillarge" :overlay="ui.etroite">
    <q-page-sticky v-if="ui.filtreMsg" position="top" :offset="[0,0]"
      style="z-index:1000!important">
      <div class="bg-yellow-3 text-black text-bold font-mono q-pa-xs">{{ui.filtreMsg}}</div>
    </q-page-sticky>

    <q-scroll-area :class="'fit ' + dkli(1)">
      <div>
        <div class="row justify-bettween q-mb-md">
          <btn-cond class="q-mr-sm" icon="chevron_right" 
            color="warning" @ok="ui.fermFiltre"/>
          <div class="titre-lg">{{$t('MLArech')}}</div>
        </div>
        <div v-if="ui.page === 'chats'" class="column justify-start">
          <filtre-rac nom="chats" prop='rac' :idx="0"/>
          <filtre-nbj nom="chats" prop='nbj' :idx="1"/>
          <filtre-nom nom="chats" prop='nom' :idx="0"/>
          <filtre-nom nom="chats" prop='txt' :idx="1"/>
          <filtre-mc nom="chats" attr="mcp" :idx="0"/>
          <filtre-mc nom="chats" attr="mcn" :idx="1"/>
        </div>
        <div v-if="ui.page === 'espace'" class="column justify-start">
          <filtre-tri nom="espace" :nb-options="19" :idx="0"/>
        </div>
        <div v-if="ui.page === 'partition'" class="column justify-start">
          <filtre-nom nom="partition" prop='nomc' :idx="0"/>
          <filtre-notif nom="partition" :idx="1"/>
          <filtre-avecsp nom="partition" :idx="0"/>
          <filtre-tri nom="partition" :nb-options="9" :idx="1"/>
        </div>
        <div v-if="ui.page === 'people'" class="column justify-start">
          <filtre-nom nom="people" prop='nom' :idx="0"/>
          <filtre-avecgr nom="people" :idx="1"/>
          <filtre-mc nom="people" attr="mcp" :idx="0"/>
          <filtre-mc nom="people" attr="mcn" :idx="1"/>
          <filtre-del v-if="session.compte.idp" nom="people" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupes'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-nom nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
          <filtre-ainvits nom="groupes" attr="invits" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupesac'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-nom nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
          <filtre-ainvits nom="groupes" attr="invits" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupe'" class="column justify-start">
          <filtre-nom nom="groupe" prop='nmb' :idx="0"/>
          <filtre-stmb nom="groupe" prop="stmb" :idx="1"/>
          <filtre-ambno nom="groupe" prop="ambno" :idx="0"/>
        </div>
        <div v-if="ui.page === 'invitation'" class="column justify-start">
          <filtre-nom nom="people" prop='nom' :idx="0"/>
          <filtre-mc nom="people" attr="mcp" :idx="1"/>
          <filtre-mc nom="people" attr="mcn" :idx="0"/>
        </div>
        <div v-if="ui.page === 'notes'" class="column justify-start">
          <filtre-avgr nom="notes" prop='avgr' :idx="0"/>
          <filtre-nbj nom="notes" prop='nbj' :idx="1"/>
          <filtre-nom nom="notes" prop='note' :idx="0"/>
          <filtre-mc nom="notes" attr="mcp" :idx="1"/>
          <filtre-mc nom="notes" attr="mcn" :idx="0"/>
          <filtre-vols nom="notes" attr="vf" :idx="1"/>
        </div>
      </div>
    </q-scroll-area>
  </q-drawer>

  <q-page-container>
    <transition-group appear
      leave-active-class="animated animate__slideOutLeft"
      enter-active-class="animated animate__slideInRight">
      <div v-if="ui.page === 'null'">
      </div>
      <page-admin class="page" v-if="ui.page === 'admin'"/>
      <page-login class="page" v-if="ui.page === 'login'"/>
      <page-clos class="page" v-if="ui.page === 'clos'"/>
      <page-session class="page" v-if="ui.page === 'session'"/>
      <page-accueil class="page" v-if="ui.page === 'accueil'"/>
      <page-compte class="page" v-if="ui.page === 'compte'"/>
      <page-sponsorings class="page" v-if="ui.page === 'sponsorings'"/>
      <page-chats class="page" v-if="ui.page === 'chats'"/>
      <page-compta class="page" v-if="ui.page === 'compta'"/>
      <page-espace class="page" v-if="ui.page === 'espace'"/>
      <page-partition class="page" v-if="ui.page === 'partition'"/>
      <page-people class="page" v-if="ui.page === 'people'"/>
      <page-groupes tous class="page" v-if="ui.page === 'groupes'"/>
      <page-groupes class="page" v-if="ui.page === 'groupesac'"/>
      <page-groupe class="page" v-if="ui.page === 'groupe'"/>    
      <page-invitation class="page" v-if="ui.page === 'invitation'"/>    
      <page-notes class="page" v-if="ui.page === 'notes'"/>    
      <page-ficav class="page" v-if="ui.page === 'ficavion'"/>
    </transition-group>
  </q-page-container>

  <!-- Gestion d'un message s'affichant en bas -->
  <q-dialog v-model="ui.d.a.aunmessage" seamless position="bottom">
    <div :class="'msgb q-pa-sm cursor-pointer text-center titre-sm text-bold bg-yellow-5 ' + (ui.message.important ? 'text-negative' : 'text-black')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
  </q-dialog>

  <!-- Affiche d'un message demandant confirmation 'j'ai lu' -->
  <q-dialog v-model="ui.d.a.diag" persistent>
    <q-card :class="lidk + ' spsm q-pa-sm'">
      <div class="text-center titre-lg q-my-sm">{{$t('MLAatt')}}</div>
      <div class="fs-md text-center q-b-md" v-html="ui.diag"></div>
      <div class="row q-my-md justify-end"> 
        <btn-cond flat icon="check" :label="$t('jailu')" @ok="ui.fD(); ui.diagresolve()"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Affiche l'annonce de suppression proche du compte -->
  <q-dialog v-model="ui.d.a.estzombi" persistent>
    <q-card :class="lidk + ' spsm q-pa-sm row'">
      <q-avatar class="q-mr-md col-auto" size="lg" square>
        <img src="~assets/zombi.png">
      </q-avatar>
      <div class="col column items-center">
        <div class="titre-lg">{{$t('MLAcptz', session.compte.nbj, {count: session.compte.nbj})}}</div>
        <div class="titre-md">{{$t('MLAcptz' + (session.compte.estA ? 'A' : '0'))}}</div>
        <btn-cond class="q-mt-lg self-end" icon="check" :label="$t('jailu')" @ok="ui.fD()"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- Demande de confirmation d'une fermeture de dialogue avec perte de saisie -->
  <q-dialog v-model="ui.d.a.confirmFerm" persistent>
    <q-card :class="styp('sm') + 'q-pa-sm'">
      <q-card-section class="q-my-lg titre-md">{{$t('EMDqss')}}</q-card-section>
      <q-card-actions vertical align="right">
        <btn-cond flat dense size="md" padding="xs" color="primary" 
          :label="$t('EMDjr')" @ok="ui.fD" />
        <btn-cond dense size="md" padding="xs" color="warning"  
          :label="$t('EMDjq')" @ok="fermerqm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Information / option d'installation d'une nouvelle version -->
  <q-dialog v-model="ui.d.a.reload" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <div class="row justify-between items-start">
        <btn-cond dense icon="close" :label="$t('plustard')" @ok="ui.fD"/>
        <bouton-help page="recharger-app"/>
      </div>
      <div class="titre-lg text-center text-warning q-my-md">{{$t('RLnvver2')}}</div>
      <div class="titre-md q-mb-sm">{{$t('RLtit1')}}</div>
      <div class="titre-md q-mb-sm">{{$t('RLtit2')}}</div>

      <div class="row no-wrap items-start justify-between q-mb-sm">
        <div class="row">
          <div class="titre-md text-bold text-primary q-pr-sm lg1">{{$t('RLopt', ['1'])}}</div>
          <div class="col-auto">
            <span class="titre-md q-pr-sm">{{$t('RLopt1')}}</span>
            <btn-cond icon="system_update" :label="$t('RLinstal')" @ok="reload"/>
          </div>
        </div>
        <bouton-bulle idtext="rl1"/>
      </div>

      <div class="row no-wrap items-start justify-between q-mb-sm">
        <div class="row">
          <div class="titre-md text-bold text-primary q-pr-sm lg1">{{$t('RLopt', ['2'])}}</div>
          <div class="titre-md">{{$t('RLopt2')}}</div>
        </div>
        <bouton-bulle class="text-right" idtext="rl2"/>
      </div>

      <div class="row no-wrap items-start q-mb-sm">
        <div class="titre-md text-bold text-primary q-pr-sm lg1">{{$t('RLopt', ['3'])}}</div>
        <div class="titre-md">{{$t('RLopt3')}}</div>
      </div>

    </q-card>
  </q-dialog>

  <!-- Choix de déconnexion. Déconnexion, reconnexion, continuer -->
  <q-dialog v-model="ui.d.a.dialoguedrc" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('MLAdrc')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card-actions vertical align="stretch" class="titre-md q-gutter-sm">
        <q-btn flat dense :label="$t('MLAdecon')" @click="deconnexion()">
          <q-icon right name="logout" color="warning" size="lg"/>
        </q-btn>
        <q-btn flat dense :label="$t('MLArecon')" @click="reconnexion()">
          <q-icon right name="logout" color="warning" size="lg"/>
        </q-btn>
        <q-btn flat dense :label="$t('MLAcont')" @click="ui.fD"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <dialogue-erreur v-if="ui.d.a.dialogueerreur"/>
  <dialogue-help v-if="ui.d.a.dialoguehelp"/>
  <presse-papier v-if="ui.d.a.pressepapier"/>
  <panel-people v-if="ui.d.a.detailspeople"/>
  <outils-tests v-if="ui.d.a.outilsTests"/>
  <phrase-secrete v-if="ui.d.a.phrasesecrete"/>

  <!-- Affiche l'opération en cours et propose son interruption -->
  <q-dialog v-model="ui.d.a.opDialog" seamless position="top" full-width persistent
    transition-show="scale" transition-hide="scale">
    <div class="q-mt-sm column items-center" style="width:20rem">
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div v-if="session.opSpinner >= 2" 
          class="spinlargeur height-5 row items-center justify-between no-wrap text-black bg-amber-2 q-pa-sm"
          style="margin:0 auto; overflow:hidden;">
          <div class="col column items-center">
            <div class="text-bold titre-md">{{$t('MLAbrk')}}</div>
            <div class="text-bold oplbl">{{session.opEncours.label}}</div>
          </div>
          <div class="col-auto q-mt-sm cursor-pointer column items-center" style="position:relative"
            @click="ui.oD('confirmstopop', 'a')">
            <q-spinner color="primary" size="3rem" :thickness="4"/>
            <q-badge color="negative" class="text-white stopbtn">{{session.opSpinner}}</q-badge>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <!-- Confirmation d'interruption de l'opération en cours -->
  <q-dialog v-model="ui.d.a.confirmstopop">
    <q-card :class="styp('sm')">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [session.opEncours ? session.opEncours.label : '???'])}}</q-card-section>
      <q-card-actions vertical align="right" class="q-gutter-sm">
        <btn-cond flat :label="$t('MLAcf3')" @ok="ui.fD"/>
        <btn-cond color="warning" :label="$t('MLAcf4')" @ok="stopop"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Gestion de la synchronisation automatique -->
  <q-dialog v-model="ui.d.a.sync" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm column items-center'">
      <bouton-help class="self-end" page="statuspush-man"/>

      <div v-if="config.permission" class="titre-lg q-my-md text-center">{{$t('MLAntfg')}}</div>
      <div v-else class="msg2 titre-lg text-italic text-bold q-my-md text-center">{{$t('MLAntfd')}}</div>

      <div v-if="!config.permission" class="titre-md q-my-md text-center">
        <btn-cond v-if="config.permState === 'prompt'" flat :label="$t('MLAntfr1')" @ok="demperm"/>
        <div v-else class="titre-lg text-italic text-center">{{$t('MLAntfr2')}}</div>
      </div>

      <div v-if="config.permission && session.statusHB" class="column q-my-md justify-center">
        <div class="titre-lg text-center">{{$t('MLAhbOK')}}</div>
        <div class="q-my-md titre-md text-center">{{$t('MLAmajok')}}</div>
      </div>

      <div v-if="config.permission && !session.statusHB" 
        class="q-my-md column justify-center">
        <div class="titre-lg text-center">{{$t('MLAhbKO')}}</div>
        <btn-cond class="q-my-md" :label="$t('MLAraf')" @ok="resync"/>
      </div>

      <btn-cond class="q-my-md" flat :label="$t('jailu')" @ok="ui.fD"/>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script setup>
import { watchEffect, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import stores from './stores/stores.mjs'
import { AMJ, HBINSECONDS } from './app/api.mjs'

import { set$t, hms, dkli, styp } from './app/util.mjs'
import { deconnexion, SyncFull } from './app/synchro.mjs'
import { CV } from './app/modele.mjs'
import { SetDhvuCompte } from './app/operations4.mjs'

import BtnCond from './components/BtnCond.vue'
import IconMode from './components/IconMode.vue'
import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
import BoutonBulle from './components/BoutonBulle.vue'
import NotifIcon from './components/NotifIcon.vue'
import QueueIcon from './components/QueueIcon.vue'
import FiltreNom from './components/FiltreNom.vue'
import FiltreMc from './components/FiltreMc.vue'
import FiltreNbj from './components/FiltreNbj.vue'
import FiltreAvecgr from './components/FiltreAvecgr.vue'
import FiltreDel from './components/FiltreDel.vue'
import FiltreAvecsp from './components/FiltreAvecsp.vue'
import FiltreTri from './components/FiltreTri.vue'
import FiltreNotif from './components/FiltreNotif.vue'
import FiltreSansheb from './components/FiltreSansheb.vue'
import FiltreEnexcedent from './components/FiltreEnexcedent.vue'
import FiltreAinvits from './components/FiltreAinvits.vue'
import FiltreStmb from './components/FiltreStmb.vue'
import FiltreAmbno from './components/FiltreAmbno.vue'
import FiltreAvgr from './components/FiltreAvgr.vue'
import FiltreVols from './components/FiltreVols.vue'
import FiltreRac from './components/FiltreRac.vue'
import DialogueErreur from './dialogues/DialogueErreur.vue'
import MenuAccueil from './components/MenuAccueil.vue'
import PhraseSecrete from './dialogues/PhraseSecrete.vue'

// niveau 2
import PageSession from './pages/PageSession.vue'
import PageFicav from './pages/PageFicav.vue'
import OutilsTests from './panels/OutilsTests.vue'

// Niveau 3
import DialogueHelp from './panels/DialogueHelp.vue'
import PageClos from './pages/PageClos.vue'
import PageAccueil from './pages/PageAccueil.vue'
import PressePapier from './panels/PressePapier.vue'

// Niveau 4
import PageSponsorings from './pages/PageSponsorings.vue'
import PageEspace from './pages/PageEspace.vue'

// Niveau 5
import PageLogin from './pages/PageLogin.vue'

// Niveau 6
import PageAdmin from './pages/PageAdmin.vue'
import PagePeople from './pages/PagePeople.vue'

// Niveau 7
import PageCompte from './pages/PageCompte.vue'
import PageChats from './pages/PageChats.vue'
import PageCompta from './pages/PageCompta.vue'
import PageNotes from './pages/PageNotes.vue'
import PagePartition from './pages/PagePartition.vue'
import PanelPeople from './panels/PanelPeople.vue'

// Niveau 8
import PageGroupes from './pages/PageGroupes.vue'

// Niveau 10
import PageGroupe from './pages/PageGroupe.vue'
import PageInvitation from './pages/PageInvitation.vue'

const $t = useI18n().t
const $q = useQuasar()
$q.dark.set(true)
set$t($t, $q)

const session = stores.session
const aSt = stores.avatar 
const gSt = stores.groupe
const people = stores.people
const config = stores.config
const ui = stores.ui

ui.setScreenWH($q.screen.width, $q.screen.height)
watchEffect(() => {
  // console.log($q.screen.width, $q.screen.height)
  ui.setScreenWH($q.screen.width, $q.screen.height)
})

const offset = computed(() => ui.pagetab ? [0, -55] : [0, -25])
const lidk = computed(() => $q.dark.isActive ? 'sombre0' : 'clair0')
const aHome = computed(() => session.status === 2 && ui.page !== 'accueil')
      || (!session.status && ui.page !== 'login')
const titrePage = computed(() => {
  const p = ui.page
  let arg = ''
  switch (p) {
    case 'espace' : { return $t('Pespace', [session.org]) }
    case 'partition' : { 
      if (session.pow > 3) return $t('Ppartition2')
      const p = session.partitionC || session.partition
      return $t('Ppartition', [session.codePart(p.id)])
    }
    case 'sponsorings' : { arg = aSt.avC ? people.getCV(session.avatarId).nom : '?'; break }
    case 'groupesac' : { arg = aSt.avC ? people.getCV(session.avatarId).nom : '?'; break }
    case 'groupe' : { arg = gSt.egrC ? people.getCV(session.groupeId).nom : $t('disparu'); break }
    case 'invitation' : { arg = gSt.egrC ? people.getCV(session.groupeId).nom : $t('disparu'); break }
  }
  return $t('P' + p, [arg])
})

async function demperm () {
  const p = await Notification.requestPermission()
  console.log('Notification: ', p)
  await new SyncFull().run()
  ui.fD()
}

async function resync () {
  await new SyncFull().run()
  ui.fD()
}

async function modea () {
  await new SyncFull().run()
  setTimeout(async () => {
    await session.startHB()
  }, HBINSECONDS * 500)
  ui.fD()
}

async function moded () {
  await session.stopHB()
  ui.fD()
}

async function discon () {
  if (session.status === 3) await deconnexion()
  else ui.oD('dialoguedrc', 'a')
}

async function reconnexion () { 
  ui.fD()
  await deconnexion(true)
  if (config.permission) await Notification.requestPermission()
}

function reload () { 
  setTimeout(() => {
    location.reload(true) 
  }, 1000)
}

function stopop () {
  const op = session.opEncours
  if (op && op.stop) op.stop()
  ui.fD()
}

function clickNotif () { ui.setPage('compta', 'notif') }
function gotoAccueilLogin () { ui.setPage(session.status === 2 ? 'accueil' : 'login') }
function fermerqm () {
  ui.fD()
  setTimeout(() => { ui.fD() }, 50)
}
async function jailu () { if (session.accesNetNf) await new SetDhvuCompte().run() }
</script>

<style lang="css">
input:placeholder-shown { color: grey !important; font-style:italic }

.animate__slideInRight {
  --animate-duration: 0.2s;
}
.animate__slideOutLeft {
  --animate-duration: 0.2s;
}
/* Sinon les boutons en haut à droite dans toolbar sont partiellement masqués à droite par 
un élément qui apparaît quand le drawer est caché*/
.q-drawer__opener { z-index: 0 !important }
</style>

<style lang="css">
.q-dialog__inner { padding: 0cm !important; }
</style>

<style lang="css">
@import 'animate.css'
</style>

<style lang="sass" scoped>
@import './css/app.sass'
.stopbtn
  position: relative
  top: -2rem
.spinlargeur
  width: 15rem
  max-width: 95vw
.q-tab
  min-height: 0 !important
.msgb
  min-width:100vw !important
  height:1.9rem
  overflow: hidden
.lg1
  min-width: 6rem
.img
  border-radius: 12px
.oplbl
  line-height: 1rem
  max-height: 4rem
  overflow-y: hidden
.msg2
  color: black
  background-color: $yellow5
  padding: 1px
</style>
