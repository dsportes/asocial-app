<template>
<q-layout view="hHh lpR fFf">
  <q-header elevated>
    <q-toolbar class="full-width">

      <bouton-help page="page1"/>

      <!-- Notifications -->
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :alire="session.alire" :niv="session.niv" 
        @click="clickNotif" apptb/>
      <!-- Test du look des icones de notification
      <notif-icon v-if="session.status === 2" class="q-ml-xs" alire :niv="1" 
        @click="clickNotif" apptb/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="2" 
        @click="clickNotif" apptb/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" alire :niv="3" 
        @click="clickNotif" apptb/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="4" 
        @click="clickNotif" apptb/>
      <notif-icon v-if="session.status === 2" class="q-ml-xs" :niv="5" 
        @click="clickNotif" apptb/>
      -->

      <q-btn v-if="session.ok && !session.estMinimal" 
        dense size="md" icon="menu" round padding="none">
        <q-menu v-model="ui.menug" max-height="90vh" class="sombre1 text-white">
          <page-menu menu/>
        </q-menu>
      </q-btn>

      <q-btn :disable="!aHome" flat icon="home" dense size="md" padding="none"
        :color="aHome ? 'warning' : 'grey'" @click="gotoAccueilLogin()"/>

      <q-btn v-if="ui.pageback" icon="arrow_back" dense size="md" round padding="none"
        @click="ui.gotoBack()"/>

      <q-toolbar-title class="titre-lg text-center"><span>{{titrePage}}</span>
      </q-toolbar-title>

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
      <bouton-help page="page1"/>

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

      <q-toolbar-title class="titre-md text-right q-mx-xs">
        <span v-if="session.ok" class="titre-lg">{{aSt.avC.na.nomc}}</span>
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
        <div v-if="ui.page === 'tranche'" class="column justify-start">
          <filtre-nom nom="tranche" prop='nomc' :idx="0"/>
          <filtre-notif nom="tranche" :idx="1"/>
          <filtre-avecsp nom="tranche" :idx="0"/>
          <filtre-tri nom="tranche" :nb-options="9" :idx="1"/>
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
      <page-tranche class="page" v-if="ui.page === 'tranche'"/>
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

  <q-dialog v-model="ui.d.opDialog" seamless position="top" full-width persistent
    transition-show="scale" transition-hide="scale">
    <div class="q-mt-sm column items-center" style="width:20rem">
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div v-if="session.opSpinner >= 2" 
          class="spinlargeur height-4 row items-center justify-between no-wrap text-black bg-amber-2 q-pa-sm"
          style="margin:0 auto; overflow:hidden;">
          <div class="col column items-center">
            <div class="text-bold">{{$t('MLAbrk')}}</div>
            <div class="text-bold">{{session.opEncours.label}}</div>
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
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

import stores from './stores/stores.mjs'
import { ID } from './app/api.mjs'
import { set$t, hms, dkli, styp } from './app/util.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'
import { SetDhvuCompta } from './app/operations.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
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
import PageTranche from './pages/PageTranche.vue'
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
    BoutonHelp, BoutonLangue, NotifIcon, QueueIcon, OutilsTests,
    PageGroupe, PageGroupes, PageNotes, PageFicavion,
    PageAdmin, PageMenu, PageLogin, PageClos, PageSession, PageAccueil, PageCompte, PageSponsorings, PageChats,
    PageCompta, PageEspace, PageTranche, PagePeople, PanelPeople, PanelMembre,
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
        case 'tranche' : { 
          if (this.session.pow > 3) return this.$t('ACspons')
          return this.$t('Ptranche', [ID.court(this.aSt.tribuC.id), this.aSt.tribuC.info])
        }
        case 'sponsorings' : { arg = this.aSt.avC ? this.aSt.avC.na.nom : '?'; break }
        case 'groupesac' : { arg = this.aSt.avC ? this.aSt.avC.na.nom : '?'; break }
        case 'groupe' : { arg = this.gSt.egrC ? this.gSt.egrC.groupe.na.nom : this.$t('disparu'); break }
      }
      return this.$t('P' + p, [arg])
    }
  },

  // Gère le franchissement du seuil etroit / large
  watch: {
    "$q.screen.width"() {
      this.ui.setScreenWidth(this.$q.screen.width)
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
    async reconnexion () { this.ui.fD(); await reconnexionCompte() },

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
    ui.setScreenWidth($q.screen.width)

    /* Template de onAction ************************************************
    ui.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setPage') console.log('Ouverture page: ' + args[0])
      })
    })
    */

    return {
      session: stores.session,
      aSt: stores.avatar, 
      gSt: stores.groupe, 
      ui, 
      styp, dkli, hms, deconnexion
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
</style>
