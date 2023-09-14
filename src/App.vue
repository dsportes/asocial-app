<template>
<q-layout view="hHh LPR lfr">
  <q-header elevated>
    <q-toolbar>
      <bouton-help page="page1"/>

      <bouton-langue style="position:relative;top:2px;"/>

      <!-- Dark ou clair -->
      <q-btn dense size="md" icon="contrast" @click="tgdark">
        <q-tooltip>{{$t('clairfonce')}}</q-tooltip>
      </q-btn>

      <!-- Outils et tests -->
      <q-btn dense size="md" icon="settings" @click="ovOutilsTests">
        <q-tooltip>{{$t('MLAout')}}</q-tooltip>
      </q-btn>

      <!-- Information session : mode synchro -->
      <q-btn class="q-mr-xs" v-if="session.synchro" @click="infoSession('page1')"
        dense size="md" icon="autorenew" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
        <queue-icon/>
      </q-btn>

      <!-- Information session : mode incognito -->
      <q-avatar class="cursor-pointer q-mr-xs" v-if="session.incognito" @click="infoSession('page2')"
        size="sm" square color="primary">
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <!-- Information session : mode avion -->
      <q-btn class="cursor-pointer q-mr-xs" v-if="session.avion" @click="infoSession('page3')"
        dense size="md" icon="airplanemode_active" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
        <queue-icon/>
      </q-btn>

      <!-- Notifications -->
      <notif-icon2 v-if="session.status === 2" class="q-ml-xs" :alire="session.alire" :niv="session.niv" 
        @click="clickNotif" apptb/>

      <q-toolbar-title class="titre-md text-right cursor-pointer q-mx-xs">
        <span v-if="session.ok" class="titre-lg cursor-pointer"  
          @click="MD.oD('detailsavatar')">{{aSt.avC.na.nomc}}</span>
        <span v-else class="titre-md text-italic">{{$t('MLAsfer')}}</span>
        <span v-if="session.org" class="q-ml-md titre-md">[{{session.org}}]</span>
      </q-toolbar-title>

      <!-- Déconnexion -->
      <q-btn v-if="session.status > 1" dense size="md" color="warning" icon="logout"
        @click="discon">
        <q-tooltip>{{$t('MLAdrc')}}</q-tooltip>
        <span class="fs-sm font-mono">{{hms(session.dh)}}</span>
      </q-btn>
    </q-toolbar>

    <q-toolbar inset class="full-width bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-btn v-if="session.ok && session.niv !== 2" size="md" icon="menu">
        <q-menu v-model="ui.menug" max-height="90vh" class="bg-secondary text-white">
          <page-menu menu/>
        </q-menu>
      </q-btn>
      <q-btn :disable="!aHome" flat icon="home" size="md" 
        :color="aHome ? 'warning' : 'grey'" dense @click="gotoAccueilLogin()"/>
      <q-btn v-if="ui.pageback" flat icon="arrow_back" size="md" 
        dense @click="gotoBack()"/>
      <q-toolbar-title class="titre-lg text-center"><span>{{titrePage}}</span>
      </q-toolbar-title>

      <q-btn v-if="ui.etroite && ui.filtre" color="warning"
        dense size="md" icon="search" @click="ouvrFiltre">
        <q-tooltip>{{$t('MLAfiltre')}}</q-tooltip>
      </q-btn>

      <!-- Fichiers avion -->
      <q-btn v-if="session.ok" :disable="session.incognito" dense size="md" icon="save"
        @click="pageFicavion">
        <q-tooltip>{{$t('MLAfav')}}</q-tooltip>
      </q-btn>

      <!-- Presse papier -->
      <q-btn v-if="session.ok" dense size="md" icon="content_paste"
        @click="MD.oD('pressepapier')">
        <q-tooltip>{{$t('MLApp')}}</q-tooltip>
      </q-btn>

    </q-toolbar>

    <q-toolbar v-if="ui.page === 'compta'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="notif" :label="$t('PNCntf')" @click="ui.setPageTab('notif')"/>
        <q-tab name="compta" :label="$t('PNCabo')" @click="ui.setPageTab('compta')"/>
        <q-tab name="chats" :label="$t('PNCchats')" @click="ui.setPageTab('chats')"/>
      </q-tabs>
      <q-btn v-if="ui.pagetab==='notif'" class="col-auto q-px-sm" dense size="md" color="warning" 
        icon="check" :label="$t('jailu')" @click="ui.jailu()"/>
    </q-toolbar>

    <q-toolbar v-if="ui.page === 'groupe'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="groupe" :label="$t('ACtgr')" @click="ui.setPageTab('groupe')"/>
        <q-tab name="membres" :label="$t('ACtmb')" @click="ui.setPageTab('membres')"/>
      </q-tabs>
    </q-toolbar>

  </q-header>

  <q-drawer v-if="ui.filtre" v-model="ui.menu" side="right" elevated bordered persistent
    :width="ui.drawer" :breakpoint="ui.seuillarge" :show-if-above="!ui.etroite"
    :overlay="ui.etroite">
    <q-scroll-area :class="'fit ' + dkli(1)">
      <div>
        <div class="row justify-bettween q-mb-md">
          <q-btn v-if="ui.etroite" class="q-mr-sm" icon="chevron_right" color="warning" size="md" dense @click="fermFiltre"/>
          <div class="titre-lg">{{$t('MLArech')}}</div>
        </div>
        <div v-if="ui.page === 'chats'" class="column justify-start">
          <filtre-nbj nom="chats" prop='nbj' :idx="0"/>
          <filtre-nom nom="chats" prop='nom' :idx="1"/>
          <filtre-txt nom="chats" prop='txt' :idx="0"/>
          <filtre-mc nom="chats" attr="mcp" :idx="1"/>
          <filtre-mc nom="chats" attr="mcn" :idx="0"/>
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
        </div>
        <div v-if="ui.page === 'groupes'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-txt nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
          <filtre-ainvits nom="groupes" attr="invits" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupesac'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-txt nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
          <filtre-ainvits nom="groupes" attr="invits" :idx="0"/>
        </div>
        <div v-if="ui.page === 'groupe'" class="column justify-start">
          <filtre-nom nom="groupe" prop='nmb' :idx="0"/>
          <filtre-stmb nom="groupe" prop="stmb" :idx="1"/>
        </div>
        <div v-if="ui.page === 'notes'" class="column justify-start">
          <filtre-avgr nom="notes" prop='avgr' :idx="0"/>
          <filtre-nbj nom="notes" prop='nbj' :idx="1"/>
          <filtre-txt nom="notes" prop='note' :idx="0"/>
          <filtre-mc nom="notes" attr="mcp" :idx="1"/>
          <filtre-mc nom="notes" attr="mcn" :idx="0"/>
          <filtre-vols nom="notes" attr="v1" :idx="1"/>
          <filtre-vols nom="notes" attr="v2" :idx="0"/>
          <filtre-temp nom="notes" :idx="1"/>
        </div>
      </div>
    </q-scroll-area>
  </q-drawer>

  <q-page-container>
    <transition-group appear
      leave-active-class="animated animate__slideOutLeft"
      enter-active-class="animated animate__slideInRight">
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

  <q-dialog v-model="ui.aunmessage" seamless position="bottom">
    <div :class="'q-pa-sm cursor-pointer ' + (ui.message.important ? 'msgimp' : 'text-white bg-grey-9')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
  </q-dialog>

  <q-dialog v-model="diag" persistent>
    <q-card :class="lidk + ' petitelargeur q-pa-sm'">
      <div class="text-center titre-lg q-my-sm">{{$t('UTIatt')}}</div>
      <div class="fs-md text-center q-b-md" v-html="ui.diag"></div>
      <q-btn flat dense color="primary" size="md" :label="$t('jailu')"
          @click="MD.fD();ui.diagresolve()"/>
    </q-card>
  </q-dialog>

  <q-dialog v-model="cf" persistent>
    <q-card :class="lidk + ' petitelargeur q-pa-sm'">
      <q-card-section class="q-my-lg titre-md">{{$t('EMDqss')}}</q-card-section>
      <q-card-actions vertical align="right">
        <q-btn flat :label="$t('EMDjr')" color="primary" @click="MD.fD" />
        <q-btn flat :label="$t('EMDjq')" color="warning" @click="fermerqm" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="dialoguedrc" persistent>
    <q-card class="bs petitelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('MLAdrc')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-card-actions vertical align="center">
        <q-btn class="w15" dense size="md" color="warning"
          icon="logout" :label="$t('MLAdecon')" @click="deconnexion"/>
        <q-btn class="q-ma-xs w15" dense size="md" color="warning"
          icon="logout" :label="$t('MLArecon')" @click="reconnexion"/>
        <q-btn class="q-ma-xs w15" dense size="md" color="primary"
          :label="$t('MLAcont')" @click="MD.fD()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="dialogueerreur" persistent>
    <dialogue-erreur class="bs"/>
  </q-dialog>

  <q-dialog v-model="dialoguehelp" full-height position="left" persistent>
    <dialogue-help/>
  </q-dialog>

  <q-dialog v-model="pressepapier" full-height position="left" persistent>
    <presse-papier/>
  </q-dialog>

  <q-dialog v-model="outilsTests" full-height persistent>
    <outils-tests class="bs"/>
  </q-dialog>

  <q-dialog v-model="detailspeople" full-height persistent>
    <panel-people class="bs" :id="session.peopleId"/>
  </q-dialog>

  <q-dialog v-model="detailsmembre" full-height persistent>
    <panel-membre class="bs"/>
  </q-dialog>

  <q-dialog v-model="detailsavatar" full-height persistent>
    <q-layout container view="hHh lpR fFf" :class="'bs ' + dkli(0)" style="width:90vw">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtitav', [aSt.avC.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card class="q-pa-sm largeur40">
          <apercu-avatar edit :idav="aSt.avC.id"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <q-dialog v-model="opDialog" seamless position="top" full-width persistent
    transition-show="scale" transition-hide="scale">
    <div class="q-mt-sm column items-center">
      <transition appear enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
        <div v-if="session.opSpinner >= 2" 
          class="spinlargeur height-4 row items-center justify-between no-wrap text-black bg-amber-2 q-pa-sm"
          style="margin:0 auto; overflow:hidden;">
          <div class="col column items-center">
            <div class="text-bold">{{$t('MLAbrk')}}</div>
            <div class="text-bold">{{session.opEncours.nom}}</div>
          </div>
          <div class="col-auto q-mt-sm cursor-pointer column items-center" style="position:relative"
            @click="ovConfirmstopop">
            <q-spinner color="primary" size="3rem" :thickness="4"/>
            <q-badge color="negative" class="text-white stopbtn">{{session.opSpinner}}</q-badge>
          </div>
        </div>
      </transition>
    </div>
  </q-dialog>

  <q-dialog v-model="confirmstopop">
    <q-card class="bs">
      <q-card-section class="q-pa-md fs-md text-center">
        {{$t('MLAcf', [session.opEncours ? session.opEncours.nom : '???'])}}</q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$t('MLAcf3')" color="warning" @click="MD.fD"/>
        <q-btn flat :label="$t('MLAcf4')" color="primary" @click="stopop"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script>
import { useQuasar } from 'quasar'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import stores from './stores/stores.mjs'
import { ID } from './app/api.mjs'

import { set$t, hms, dkli } from './app/util.mjs'
import { MD } from './app/modele.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
import NotifIcon2 from './components/NotifIcon2.vue'
import QueueIcon from './components/QueueIcon.vue'

import PageAdmin from './pages/PageAdmin.vue'
import PageMenu from './pages/PageMenu.vue'
import PageLogin from './pages/PageLogin.vue'
import PageClos from './pages/PageClos.vue'
import PageSession from './pages/PageSession.vue'
import PageAccueil from './pages/PageAccueil.vue'
import PageCompte from './pages/PageCompte.vue'
import PageSponsorings from './pages/PageSponsorings.vue'
import PageChats from './pages/PageChats.vue'
import PageCompta from './pages/PageCompta.vue'
import PageEspace from './pages/PageEspace.vue'
import PageTranche from './pages/PageTranche.vue'
import PagePeople from './pages/PagePeople.vue'
import PanelPeople from './dialogues/PanelPeople.vue'
import PanelMembre from './dialogues/PanelMembre.vue'
import ApercuAvatar from './components/ApercuAvatar.vue'
import PageGroupes from './pages/PageGroupes.vue'
import PageGroupe from './pages/PageGroupe.vue'
import PageNotes from './pages/PageNotes.vue'
import PressePapier from './dialogues/PressePapier.vue'
import PageFicavion from './pages/PageFicavion.vue'

import FiltreNom from './components/FiltreNom.vue'
import FiltreTxt from './components/FiltreTxt.vue'
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
import FiltreAvgr from './components/FiltreAvgr.vue'
import FiltreVols from './components/FiltreVols.vue'
import FiltreTemp from './components/FiltreTemp.vue'

import OutilsTests from './dialogues/OutilsTests.vue'
import DialogueErreur from './dialogues/DialogueErreur.vue'
import DialogueHelp from './dialogues/DialogueHelp.vue'

export default {
  displayName: 'App',
  name: 'App',

  components: { 
    BoutonHelp, BoutonLangue, OutilsTests, NotifIcon2, QueueIcon, 
    ApercuAvatar, PageGroupe, PageGroupes, PageNotes, PageFicavion,
    PageAdmin, PageMenu, PageLogin, PageClos, PageSession, PageAccueil, PageCompte, PageSponsorings, PageChats,
    PageCompta, PageEspace, PageTranche, PagePeople, PanelPeople, PanelMembre,
    FiltreNom, FiltreTxt, FiltreMc, FiltreNbj, FiltreTri, FiltreNotif,
    FiltreAvecgr, FiltreAvecsp, FiltreTribu, FiltreSansheb, FiltreEnexcedent, FiltreAinvits, FiltreStmb,
    DialogueErreur, DialogueHelp, FiltreAvgr, FiltreVols, FiltreTemp, PressePapier
   },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },
    tbclass () { return this.$q.dark.isActive ? ' sombre1' : ' clair1' },
    aHome () { return (this.session.status === 2 && this.ui.page !== 'accueil')
      || (!this.session.status && this.ui.page !== 'login') },
    pccl () {return this.aSt.compta.pc < 80 ? 'bg-transparent' : (this.aSt.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
    titrePage () {
      const p = this.ui.page
      let arg = ''
      switch (p) {
        case 'espace' : { return this.$t('Pespace', [this.session.ns, this.session.org]) }
        case 'tranche' : { 
          if (this.session.pow > 3) return this.$t('ACspons')
          return this.$t('Ptranche', [ID.court(this.aSt.tribuC.id), this.aSt.tribuC.info])
        }
        case 'chats' : { arg = this.aSt.avC.na.nom; break }
        case 'sponsorings' : { arg = this.aSt.avC ? this.aSt.avC.na.nom : '?'; break }
        case 'groupesac' : { arg = this.aSt.avC ? this.aSt.avC.na.nom : '?'; break }
        case 'groupe' : { arg = this.gSt.egrC ? this.gSt.egrC.groupe.na.nom : '?'; break }
      }
      return this.$t('P' + p, [arg])
    }
},

  // Transmet au store ui **le franchissement du seuil** etroit / large
  watch: {
    "$q.screen.width"() {
      const et = this.$q.screen.width < this.ui.seuillarge
      if (et !== this.ui.etroite) this.ui.setEtroite(et)
    }
  },

  data () { return {
  }},

  methods: {
    discon () {
      if (this.session.status === 3) deconnexion(); else MD.oD('dialoguedrc')
    },

    stopop () {
      const op = this.session.opEncours
      if (op && op.stop) op.stop()
      MD.fD()
    },

    ouvrFiltre () { this.ui.menu = true },
    fermFiltre () { this.ui.menu = false },

    tgdark () { this.$q.dark.toggle() },

    clickNotif () {
      this.ui.setPage('compta', 'notif')
    },
    /*
    pageCompta () { 
      this.ui.setPage('compta', 'compta')
    },
    */
    pageFicavion () { 
      this.ui.setPage('ficavion')
    },
    infoSession (page) { 
      if (this.session.status === 2) this.ui.setPage('session')
      this.ui.pushhelp(page)
    },
    gotoAccueilLogin () {
      this.ui.setPage(this.session.status === 2 ? 'accueil' : 'login')
    },
    gotoBack () {
      this.ui.setPageBack()
    },
    fermerqm () {
      MD.fD()
      setTimeout(() => { MD.fD() }, 50)
    },
    deconnexion () { MD.fD(); deconnexion() },
    async reconnexion () { MD.fD(); await reconnexionCompte() }
  },

  setup () {
    set$t(useI18n().t)
    const $q = useQuasar()
    $q.dark.set(true)

    const config = stores.config
    config.$q = $q
   
    const ui = stores.ui
    if ($q.screen.width > ui.seuillarge) ui.setEtroite(false)

    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe

    const infomode = ref(false)
    const infonet = ref(false)
    const infoidb = ref(false)
    const drc = ref(false)

    const outilsTests = ref(false)
    function ovOutilsTests () { MD.oD(outilsTests) }

    const confirmstopop = ref(false)
    function ovConfirmstopop () { MD.oD(confirmstopop) }

    return {
      MD,
      session,
      config,
      ui,
      hms, dkli,
      diag: MD.declare('diag', ref(false)),
      dialoguedrc: MD.declare('dialoguedrc', ref(false)),
      dialoguehelp: MD.declare('dialoguehelp', ref(false)),
      dialogueerreur: MD.declare('dialogueerreur', ref(false)),
      detailspeople: MD.declare('detailspeople', ref(false)),
      detailsmembre: MD.declare('detailsmembre', ref(false)),
      detailsavatar: MD.declare('detailsavatar', ref(false)),
      pressepapier: MD.declare('pressepapier', ref(false)),
      opDialog: MD.declare('opDialog', ref(false)),
      cf: MD.declare('cf', ref(false)),
      outilsTests, ovOutilsTests, confirmstopop, ovConfirmstopop,
      aSt,
      gSt,
      infonet,
      infoidb,
      infomode,
      drc
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
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 2px !important
.q-item
  min-height: 0 !important
.msgimp
  background-color: $grey-2
  color: $negative
  font-weight: bold
  border: 2px solid $negative
.bdg1
  position: absolute
  top: 6px
  width: 24px
.bg2
  border-radius: 5px
  padding: 2px
.q-tab
  min-height: 0 !important

</style>
