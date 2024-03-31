<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar class="full-width">
      
      <!-- Notifications -->
      <notif-icon v-if="session.status === 2" class="q-ml-xs" 
        :alire="session.alire && session.ntfIco" 
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

      <q-btn v-if="session.ok && !session.mini && (!session.ral === 3)"
        dense size="md" icon="menu" round padding="none">
        <q-menu v-model="ui.menug" max-height="90vh" class="sombre1 text-white">
          <page-menu menu/>
        </q-menu>
      </q-btn>

      <q-btn :disable="!aHome" flat icon="home" dense size="md" padding="none"
        :color="aHome ? 'warning' : 'grey'" @click="gotoAccueilLogin()"/>

      <q-btn v-if="ui.pageback" icon="arrow_back" dense size="md" round padding="none"
        @click="ui.gotoBack()"/>

      <q-toolbar-title>
        <div style="position:relative">
          <div class="titre-lg text-right full-width">{{titrePage}}</div>
          <div v-if="session.swev2" @click="ui.oD('reload')" 
            style="position:absolute;top:-4px;left:0"
            class="row cursor-pointer items-center bg-negative q-px-xs">
            <div class="titre-md text-bold text-white q-mr-sm">{{$t('RLnvver')}}</div>
            <q-icon name="system_update" size="md" color="white"/>
          </div>
        </div>
      </q-toolbar-title>

      <bouton-help :page="'pg_' + ui.page"/>

      <!-- Fichiers avion -->
      <q-btn v-if="session.ok" :disable="session.incognito" 
        dense size="md" icon="save" round padding="none"
        @click="pageFicavion">
        <q-tooltip>{{$t('MLAfav')}}</q-tooltip>
      </q-btn>

      <!-- Presse papier -->
      <q-btn v-if="session.ok" dense size="md" 
        icon="content_paste" round padding="none"
        @click="ui.oD('pressepapier')">
        <q-tooltip>{{$t('MLApp')}}</q-tooltip>
      </q-btn>

      <q-btn v-if="session.ok && ui.aUnFiltre" 
        color="warning" round padding="none" dense size="md" icon="search" 
        @click="ui.ouvrFiltre">
        <q-tooltip>{{$t('MLAfiltre')}}</q-tooltip>
      </q-btn>

      <q-page-sticky v-if="session.signalOp" position="top" :offset="[0, -25]">
        <q-btn round color="warning" icon="wifi" padding="0"/>
      </q-page-sticky>

    </q-toolbar>

    <q-toolbar v-if="ui.page === 'compta'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="notif" :label="$t('PNCntf')" @click="ui.setTab('notif')"/>
        <q-tab name="compta" :label="$t('PNCabo')" @click="ui.setTab('compta')"/>
        <q-tab v-if="session.estComptable || aSt.compta.estA"
          name="credits" :label="$t('PNCcre')" @click="ui.setTab('credits')"/>
        <q-tab name="chats" :label="$t('PNCchats')" @click="ui.setTab('chats')"/>
      </q-tabs>
      <q-btn v-if="ui.pagetab==='notif' && session.alire" class="col-auto q-px-sm" 
        dense size="md" color="warning" padding="xs" icon="check" 
        :label="$t('jailu')" @click="jailu"/>
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
      <bouton-help page="pa"/>

      <bouton-langue style="position:relative;top:2px;"/>

      <!-- Dark ou clair -->
      <q-btn dense size="md" icon="contrast" padding="none" round 
        @click="$q.dark.toggle()">
        <q-tooltip>{{$t('clairfonce')}}</q-tooltip>
      </q-btn>

      <!-- Outils et tests -->
      <q-btn dense size="md" icon="settings" padding="none" round 
        @click="ui.oD('PAoutilsTests')">
        <q-tooltip>{{$t('MLAout')}}</q-tooltip>
      </q-btn>

      <!-- Information session : mode synchro -->
      <q-btn class="q-mr-xs" v-if="session.synchro"
        dense size="md" icon="autorenew" padding="none" round 
        @click="infoSession()">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
        <queue-icon/>
      </q-btn>

      <!-- Information session : mode incognito -->
      <q-avatar class="cursor-pointer q-mr-xs" v-if="session.incognito" @click="infoSession()"
        size="sm" square>
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <!-- Information session : mode avion -->
      <q-btn class="cursor-pointer q-mr-xs" v-if="session.avion" @click="infoSession()"
        dense size="md" icon="airplanemode_active" padding="none" round>
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
        <queue-icon/>
      </q-btn>

      <q-toolbar-title class="row justify-end items-center titre-md text-right q-mx-xs">
        <img v-if="session.ok" :src="people.getCV(session.compteId).photo" 
          height="28" width="28" class="q-pa-none q-mr-sm img"/>
        <span v-if="session.ok" class="titre-lg">{{people.getCV(session.compteId).nom}}</span>
        <span v-else class="titre-md text-italic">{{$t('MLAsfer')}}</span>
        <span v-if="session.org" class="q-ml-md titre-md">[{{session.org}}]</span>
      </q-toolbar-title>

      <!-- Déconnexion -->
      <q-btn v-if="session.status > 1" 
        dense size="md" color="warning" icon="logout" padding="none" 
        @click="discon">
        <q-tooltip>{{$t('MLAdrc')}}</q-tooltip>
        <span class="fs-sm font-mono">{{hms(session.dh)}}</span>
      </q-btn>

    </q-toolbar>
  </q-footer>

  <q-drawer v-model="ui.pfiltre" side="right" elevated bordered persistent
    :width="250" :breakpoint="ui.seuillarge" :overlay="ui.etroite">
    <q-scroll-area :class="'fit ' + dkli(1)">
      <div>
        <div class="row justify-bettween q-mb-md">
          <q-btn class="q-mr-sm" icon="chevron_right" 
            color="warning" size="md" dense @click="ui.fermFiltre"/>
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
          <filtre-tribu nom="people" :idx="1"/>
          <filtre-avecgr nom="people" :idx="0"/>
          <filtre-mc nom="people" attr="mcp" :idx="1"/>
          <filtre-mc nom="people" attr="mcn" :idx="0"/>
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
        <div v-if="ui.page === 'notes'" class="column justify-start">
          <filtre-avgr nom="notes" prop='avgr' :idx="0"/>
          <filtre-nbj nom="notes" prop='nbj' :idx="1"/>
          <filtre-nom nom="notes" prop='note' :idx="0"/>
          <filtre-mc nom="notes" attr="mcp" :idx="1"/>
          <filtre-mc nom="notes" attr="mcn" :idx="0"/>
          <filtre-vols nom="notes" attr="v2" :idx="1"/>
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
      <page-espace class="page" v-if="ui.page === 'espace'" :ns="session.ns"/>
      <page-partition class="page" v-if="ui.page === 'partition'"/>
      <page-people class="page" v-if="ui.page === 'people'"/>
      <page-groupes tous class="page" v-if="ui.page === 'groupes'"/>
      <page-groupes class="page" v-if="ui.page === 'groupesac'"/>
      <page-groupe class="page" v-if="ui.page === 'groupe'"/>    
      <page-notes class="page" v-if="ui.page === 'notes'"/>    
      <page-ficavion class="page" v-if="ui.page === 'ficavion'"/>    
    </transition-group>
  </q-page-container>

  <!-- ui.d.aunmessag : Gestion d'un message s'affichant en bas -->
  <q-dialog v-model="ui.d.aunmessage" seamless position="bottom">
    <div :class="'msg q-pa-sm cursor-pointer text-center titre-sm text-bold bg-yellow-5 ' + (ui.message.important ? 'text-negative' : 'text-black')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
  </q-dialog>

  <!-- ui.d.diag : Affiche d'un message demandant confirmation 'j'ai lu' -->
  <q-dialog v-model="ui.d.diag" persistent>
    <q-card :class="lidk + ' spsm q-pa-sm'">
      <div class="text-center titre-lg q-my-sm">{{$t('UTIatt')}}</div>
      <div class="fs-md text-center q-b-md" v-html="ui.diag"></div>
      <div class="row q-my-md justify-end"> 
        <q-btn flat dense color="primary" size="md" padding="xs" icon="check"
          :label="$t('jailu')" @click="ui.fD(); ui.diagresolve()"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- ui.d.estzombi : Affiche l'annonce de suppression proche du compte -->
  <q-dialog v-model="ui.d.estzombi" persistent>
    <q-card :class="lidk + ' spsm q-pa-sm row'">
      <q-avatar class="q-mr-md col-auto" size="lg" square>
        <img src="~assets/zombi.png">
      </q-avatar>
      <div class="col column items-center">
        <div class="titre-lg">{{$t('MLAcptz', session.nbj, {count: session.nbj})}}</div>
        <div class="titre-md">{{$t('MLAcptz' + (aSt.compta.estA ? 'A' : '0'))}}</div>
        <q-btn class="q-mt-lg self-end" flat dense color="primary" size="md" padding="xs" icon="check"
            :label="$t('jailu')" @click="ui.fD()"/>
      </div>
    </q-card>
  </q-dialog>

  <!-- ui.d.confirmFerm : demande de confirmation d'une fermeture de dialogue avec perte de saisie -->
  <q-dialog v-model="ui.d.confirmFerm" persistent>
    <q-card :class="styp('sm') + 'q-pa-sm'">
      <q-card-section class="q-my-lg titre-md">{{$t('EMDqss')}}</q-card-section>
      <q-card-actions vertical align="right">
        <q-btn flat dense size="md" padding="xs" color="primary" 
          :label="$t('EMDjr')" @click="ui.fD" />
        <q-btn dense size="md" padding="xs" color="warning"  
          :label="$t('EMDjq')" @click="fermerqm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- ui.d.reload : information / option d'instllation d'une nouvelle version -->
  <q-dialog v-model="ui.d.reload" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <q-btn size="md" padding="xs" color="primary" dense icon="close"
        :label="$t('plustard')" @click="ui.fD"/>
      <div class="titre-lg text-center text-warning q-my-md">{{$t('RLnvver2')}}</div>
      <div class="titre-md q-mb-sm">{{$t('RLtit1')}}</div>
      <div class="titre-md q-mb-sm">{{$t('RLtit2')}}</div>

      <!--
      <div class="row no-wrap items-start justify-between q-mb-sm">
        <div class="titre-md">{{$t('RLtit3')}}</div>
        <bouton-bulle idtext="rl0"/>
      </div>
      -->

      <div class="row no-wrap items-start justify-between q-mb-sm">
        <div class="row">
          <div class="titre-md text-bold text-primary q-pr-sm lg1">{{$t('RLopt', ['1'])}}</div>
          <div class="col-auto">
            <span class="titre-md q-pr-sm">{{$t('RLopt1')}}</span>
            <q-btn size="md" padding="none" icon="system_update" dense color="primary"
              :label="$t('RLinstal')" @click="reload"/>
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

  <!-- ui.d.dialoguedrc : choix de déconnexion. Déconnexion, reconnexion, continuer -->
  <q-dialog v-model="ui.d.dialoguedrc" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('MLAdrc')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card-actions vertical align="center" class="q-gutter-sm">
        <q-btn dense size="md" padding="xs" color="warning"
          icon="logout" :label="$t('MLAdecon')" @click="deconnexion"/>
        <q-btn dense size="md" padding="xs" color="warning"
          icon="logout" :label="$t('MLArecon')" @click="reconnexion"/>
        <q-btn dense size="md" padding="xs" color="primary"
          :label="$t('MLAcont')" @click="ui.fD"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <dialogue-erreur v-if="ui.d.dialogueerreur"/>
  <dialogue-help v-if="ui.d.dialoguehelp"/>
  <presse-papier v-if="ui.d.pressepapier"/>
  <panel-people v-if="ui.d.detailspeople"/>
  <panel-membre v-if="ui.d.PMdetailsmembre"/>
  <outils-tests v-if="ui.d.PAoutilsTests"/>
  <apercu-cv v-if="ui.d.ACVouvrir"/>
  <phrase-secrete v-if="ui.d.PSouvrir"/>

  <!-- Opération en cours et son arrêt -->
  <q-dialog v-model="ui.d.opDialog" seamless position="top" full-width persistent
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
            @click="ui.oD('confirmstopop')">
            <q-spinner color="primary" size="3rem" :thickness="4"/>
            <q-badge color="negative" class="text-white stopbtn">{{session.opSpinner}}</q-badge>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <q-dialog v-model="ui.d.confirmstopop">
    <q-card :class="styp('sm')">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [session.opEncours ? session.opEncours.label : '???'])}}</q-card-section>
      <q-card-actions vertical align="right" class="q-gutter-sm">
        <q-btn flat dense size="md" padding="xs" color="primary"
          :label="$t('MLAcf3')" @click="ui.fD"/>
        <q-btn dense size="md" padding="xs" color="warning"
          :label="$t('MLAcf4')" @click="stopop"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script>
import { onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import stores from './stores/stores.mjs'
import { ID, AMJ } from './app/api.mjs'

import { set$t, hms, dkli, styp, beep } from './app/util.mjs'
import { reconnexion, deconnexion } from './app/synchro.mjs'
import { CV } from './app/modele.mjs'
import { SetDhvuCompta } from './app/operations.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
import BoutonBulle from './components/BoutonBulle.vue'
import NotifIcon from './components/NotifIcon.vue'
import QueueIcon from './components/QueueIcon.vue'
import FiltreNom from './components/FiltreNom.vue'
import FiltreMc from './components/FiltreMc.vue'
import FiltreNbj from './components/FiltreNbj.vue'
import FiltreAvecgr from './components/FiltreAvecgr.vue'
import FiltreTribu from './components/FiltreTribu.vue'
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
import PageMenu from './components/MenuAccueil.vue'
import PhraseSecrete from './dialogues/PhraseSecrete.vue'

// niveau 2
import PageSession from './pages/PageSession.vue'
import PageFicavion from './pages/PageFicavion.vue'
import OutilsTests from './panels/OutilsTests.vue'

// Niveau 3
import DialogueHelp from './panels/DialogueHelp.vue'
import PageClos from './pages/PageClos.vue'
import PageAccueil from './pages/PageAccueil.vue'
import PressePapier from './panels/PressePapier.vue'

// Niveau 4
import PageSponsorings from './pages/PageSponsorings.vue'
import PageEspace from './pages/PageEspace.vue'
import ApercuCv from './dialogues/ApercuCv.vue'

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

// Niveau 9
import PanelMembre from './panels/PanelMembre.vue'

// Niveau 10
import PageGroupe from './pages/PageGroupe.vue'

export default {
  displayName: 'App',
  name: 'App',

  components: { 
    BoutonHelp, BoutonBulle, BoutonLangue, NotifIcon, QueueIcon, OutilsTests,
    PageGroupe, PageGroupes, PageNotes, PageFicavion,
    PageAdmin, PageMenu, PageLogin, PageClos, PageSession, PageAccueil, PageCompte, PageSponsorings, PageChats,
    PageCompta, PageEspace, PagePartition, PagePeople, PanelPeople, PanelMembre,
    FiltreRac, FiltreNom, FiltreMc, FiltreNbj, FiltreTri, FiltreNotif,
    FiltreAvecgr, FiltreAvecsp, FiltreTribu, FiltreSansheb, FiltreEnexcedent, FiltreAinvits, FiltreStmb,
    DialogueErreur, DialogueHelp, FiltreAvgr, FiltreVols, FiltreAmbno, 
    PressePapier, ApercuCv, PhraseSecrete
   },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },

    aHome () { return (this.session.status === 2 && this.ui.page !== 'accueil')
      || (!this.session.status && this.ui.page !== 'login') },

    titrePage () {
      const p = this.ui.page
      let arg = ''
      switch (p) {
        case 'espace' : { return this.$t('Pespace', [this.session.ns, this.session.org]) }
        case 'partition' : { 
          if (this.session.pow > 3) return this.$t('ACspons')
          const p = this.session.partitionC || this.session.partition
          return this.$t('Ppartition', [ID.court(p.id), this.session.compte.codeP(p.id)])
        }
        case 'sponsorings' : { arg = this.aSt.avC ? this.people.getCV(this.session.avatarId).nom : '?'; break }
        case 'groupesac' : { arg = this.aSt.avC ? this.people.getCV(this.session.avatarId).nom : '?'; break }
        case 'groupe' : { arg = this.gSt.egrC ? this.people.getCV(this.session.groupeId).nom : this.$t('disparu'); break }
      }
      return this.$t('P' + p, [arg])
    }
  },

  // Gère le franchissement du seuil etroit / large
  watch: {
    "$q.screen.width"() {
      this.ui.setScreenWH(this.$q.screen.width, this.$q.screen.height)
    },
    "$q.screen.height"() {
      this.ui.setScreenWH(this.$q.screen.width, this.$q.screen.height)
    }
  },

  data () { return {
  }},

  methods: {
    // deconnexion () { this.ui.fD(); deconnexion() },
    discon () {
      if (this.session.status === 3) deconnexion()
      else this.ui.oD('dialoguedrc')
    },
    async reconnexion () { this.ui.fD(); await reconnexion() },

    reload () { location.reload(true) },

    stopop () {
      const op = this.session.opEncours
      if (op && op.stop) op.stop()
      this.ui.fD()
    },

    clickNotif () {
      this.ui.setPage('compta', 'notif')
    },
    pageFicavion () { 
      this.ui.setPage('ficavion')
    },
    infoSession () { 
      if (this.session.status === 2) this.ui.setPage('session')
    },
    gotoAccueilLogin () {
      this.ui.setPage(this.session.status === 2 ? 'accueil' : 'login')
    },
    fermerqm () {
      this.ui.fD()
      setTimeout(() => { this.ui.fD() }, 50)
    },
    async jailu () {
      if (this.session.accesNetNf) await new SetDhvuCompta().run()
    }
  },

  setup () {
    set$t(useI18n().t)
    const $q = useQuasar()
    stores.config.$q = $q
    $q.dark.set(true)

    const ui = stores.ui
    ui.setScreenWH($q.screen.width, $q.screen.height)

    /* Template de onAction ************************************************
    ui.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setPage') console.log('Ouverture page: ' + args[0])
      })
    })
    */

    onMounted(async () => {
      await beep()
    })

    return {
      session: stores.session,
      aSt: stores.avatar, 
      gSt: stores.groupe,
      config: stores.config,
      people: stores.people,
      ui, CV,
      styp, dkli, hms, deconnexion, AMJ
    }
  }
}
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
.msg
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
</style>
