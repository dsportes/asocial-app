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
      <q-btn class="q-mr-xs" v-if="session.synchro" @click="infoSession"
        dense size="md" icon="autorenew" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <!-- Information session : mode incognito -->
      <q-avatar class="cursor-pointer q-mr-xs" v-if="session.incognito" @click="infoSession"
        size="sm" square color="primary">
        <img src="~assets/incognito_blanc.svg">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-avatar>

      <!-- Information session : mode avion -->
      <q-btn class="cursor-pointer q-mr-xs" v-if="session.avion" @click="infoSession"
        dense size="md" icon="airplanemode_active" color="primary">
        <q-tooltip>{{$t('MLAinfm')}}</q-tooltip>
      </q-btn>

      <!-- Comptabilité des volumes -->
      <div v-if="session.status === 2" @click="pageCompta" style="position:relative"
        :class="'cursor-pointer q-mr-xs bg2 ' + pccl">
        <q-knob v-model="aSt.compta.pc" size="24px" :thickness="1" color="black" track-color="green-9"/>
        <div class="bdg1 text-white bg-transparent text-center text-bold fs-xs font-mono">{{aSt.compta.pc + '%'}}</div>
      </div>

      <!-- Notifications -->
      <notif-icon class="q-ml-xs" :alire="session.alire" :niv="session.niv" 
        :cible="0" @click="clickNotif"/>

      <q-toolbar-title class="titre-md text-right cursor-pointer q-mx-xs">
        <span v-if="session.ok" class="titre-lg cursor-pointer"  @click="MD.oD('detailsavatar')">
          {{aSt.avC.na.nomc}}
        </span>
        <span v-else class="titre-md text-italic">{{$t('MLAsfer')}}</span>
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
        <q-menu max-height="90vh" class="bg-secondary text-white" auto-close>
          <page-menu/>
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

    </q-toolbar>

    <q-toolbar v-if="ui.page === 'compta'" inset 
      class="full-width bg-secondary text-white row justify-between">
      <q-tabs  class="col titre-md" v-model="ui.pagetab" inline-label outside-arrows mobile-arrows no-caps>
        <q-tab name="notif" :label="$t('PNCntf')" @click="ui.setPageTab('notif')"/>
        <q-tab name="compta" :label="$t('PNCesp')" @click="ui.setPageTab('compta')"/>
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
      <q-btn class="col-auto q-px-sm" dense size="md" color="warning" 
        icon="check" :label="$t('ACsec')" @click="ui.secrets()"/>
    </q-toolbar>

  </q-header>

  <q-drawer v-if="ui.filtre" v-model="ui.menu" side="right" elevated bordered persistent
    :width="250" :breakpoint="ui.seuillarge"
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
        <div v-if="ui.page === 'tribus'" class="column justify-start">
          <filtre-nom nom="tribus" prop='nomt' :idx="0"/>
          <filtre-txt nom="tribus" prop='txtt' :idx="1"/>
          <filtre-txt nom="tribus" prop='txtn' :idx="0"/>
          <filtre-notif nom="tribus" :idx="1"/>
          <filtre-tri nom="tribus" :nb-options="7" :idx="0"/>
        </div>
        <div v-if="ui.page === 'tribu'" class="column justify-start">
          <filtre-nom nom="tribu2" prop='nomc' :idx="0"/>
          <filtre-avecsp nom="tribu2" :idx="1"/>
          <filtre-notif nom="tribu2" :idx="0"/>
          <filtre-tri nom="tribu2" :nb-options="3" :idx="1"/>
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
        </div>
        <div v-if="ui.page === 'groupesac'" class="column justify-start">
          <filtre-nom nom="groupes" prop='ngr' :idx="0"/>
          <filtre-txt nom="groupes" prop='infmb' :idx="1"/>
          <filtre-mc nom="groupes" attr="mcp" :idx="0"/>
          <filtre-mc nom="groupes" attr="mcn" :idx="1"/>
          <filtre-sansheb nom="groupes" attr="sansheb" :idx="0"/>
          <filtre-enexcedent nom="groupes" attr="excedent" :idx="1"/>
        </div>
        <div v-if="ui.page === 'groupe'" class="column justify-start">
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
      <page-session class="page" v-if="ui.page === 'session'"/>
      <page-accueil class="page" v-if="ui.page === 'accueil'"/>
      <page-compte class="page" v-if="ui.page === 'compte'"/>
      <page-sponsorings class="page" v-if="ui.page === 'sponsorings'"/>
      <page-chats class="page" v-if="ui.page === 'chats'"/>
      <page-compta class="page" v-if="ui.page === 'compta'"/>
      <page-tribus class="page" v-if="ui.page === 'tribus'"/>
      <page-tribu class="page" v-if="ui.page === 'tribu'"/>
      <page-people class="page" v-if="ui.page === 'people'"/>
      <page-groupes tous class="page" v-if="ui.page === 'groupes'"/>
      <page-groupes class="page" v-if="ui.page === 'groupesac'"/>
      <page-groupe class="page" v-if="ui.page === 'groupe'"/>    
    </transition-group>
  </q-page-container>

  <q-dialog v-model="ui.aunmessage" seamless position="bottom">
    <div :class="'q-pa-sm cursor-pointer ' + (ui.message.important ? 'msgimp' : 'text-white bg-grey-9')"  
      @click="ui.effacermessage">
      {{ ui.message.texte }}
    </div>
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
    <q-layout container view="hHh lpR fFf" :class="'bs ' + dkli(0)" style="width:80vw">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtitav', [aSt.avC.na.nom])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card class="q-pa-sm largeur40">
          <apercu-avatar edit :na="aSt.avC.na"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

  <q-dialog v-model="opDialog" seamless position="top" full-width persistent
    transition-show="scale" transition-hide="scale">
    <div class="bs q-mt-sm column items-center">
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

import stores from './stores/stores.mjs'

import { $t, hms } from './app/util.mjs'
import { MD, getNg } from './app/modele.mjs'
import { reconnexionCompte, deconnexion } from './app/connexion.mjs'

import BoutonHelp from './components/BoutonHelp.vue'
import BoutonLangue from './components/BoutonLangue.vue'
import NotifIcon from './components/NotifIcon.vue'

import PageAdmin from './pages/PageAdmin.vue'
import PageMenu from './pages/PageMenu.vue'
import PageLogin from './pages/PageLogin.vue'
import PageSession from './pages/PageSession.vue'
import PageAccueil from './pages/PageAccueil.vue'
import PageCompte from './pages/PageCompte.vue'
import PageSponsorings from './pages/PageSponsorings.vue'
import PageChats from './pages/PageChats.vue'
import PageCompta from './pages/PageCompta.vue'
import PageTribus from './pages/PageTribus.vue'
import PageTribu from './pages/PageTribu.vue'
import PagePeople from './pages/PagePeople.vue'
import PanelPeople from './dialogues/PanelPeople.vue'
import PanelMembre from './dialogues/PanelMembre.vue'
import ApercuAvatar from './components/ApercuAvatar.vue'
import PageGroupes from './pages/PageGroupes.vue'
import PageGroupe from './pages/PageGroupe.vue'

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

import OutilsTests from './dialogues/OutilsTests.vue'
import DialogueErreur from './dialogues/DialogueErreur.vue'
import DialogueHelp from './dialogues/DialogueHelp.vue'

export default {
  displayName: 'App',
  name: 'App',

  components: { 
    BoutonHelp, BoutonLangue, OutilsTests, NotifIcon, ApercuAvatar,
    PageAdmin, PageMenu, PageLogin, PageSession, PageAccueil, PageCompte, PageSponsorings, PageChats,
    PageCompta, PageTribus, PageTribu, PagePeople, PanelPeople, PanelMembre,
    PageGroupe, PageGroupes,
    FiltreNom, FiltreTxt, FiltreMc, FiltreNbj, FiltreTri, FiltreNotif, FiltreAvecsp,
    FiltreAvecgr, FiltreTribu, FiltreSansheb, FiltreEnexcedent,
    DialogueErreur, DialogueHelp
   },

  computed: {
    tbclass () { return this.$q.dark.isActive ? ' sombre1' : ' clair1' },
    aHome () { return (this.session.status === 2 && this.ui.page !== 'accueil')
      || (!this.session.status && this.ui.page !== 'login') },
    pccl () {return this.aSt.compta.pc < 80 ? 'bg-transparent' : (this.aSt.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative') },
    titrePage () {
      const p = this.ui.page
      let arg = ''
      switch (p) {
        case 'tribu' : { arg = getNg(this.session.tribuCId).nom; break }
        case 'chats' : { arg = this.aSt.avC.na.nom; break }
        case 'sponsorings' : { arg = this.aSt.avC.na.nom; break }
        case 'groupesac' : { arg = this.aSt.avC.na.nom; break }
        case 'groupe' : { arg = this.gSt.egrC.groupe.na.nom; break }
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
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

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
    pageCompta () { 
      this.ui.setPage('compta', 'compta')
    },
    infoSession () { 
      this.ui.setPage('session')
    },
    gotoAccueilLogin () {
      this.ui.setPage(this.session.status === 2 ? 'accueil' : 'login')
    },
    gotoBack () {
      this.ui.setPageBack()
    },
    
    deconnexion () { MD.fD(); deconnexion() },
    async reconnexion () { MD.fD(); await reconnexionCompte() }
  },

  setup () {
    const $q = useQuasar()
    $q.dark.set(true)

    const config = stores.config
    config.$q = $q
   
    const ui = stores.ui
    ui.etroite = $q.screen.width < ui.seuillarge

    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe

    console.log($t('build', [config.build, config.debug]))

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
      hms,
      dialoguedrc: MD.declare('dialoguedrc', ref(false)),
      dialoguehelp: MD.declare('dialoguehelp', ref(false)),
      dialogueerreur: MD.declare('dialogueerreur', ref(false)),
      detailspeople: MD.declare('detailspeople', ref(false)),
      detailsmembre: MD.declare('detailsmembre', ref(false)),
      detailsavatar: MD.declare('detailsavatar', ref(false)),
      opDialog: MD.declare('opDialog', ref(false)),
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
.animate__slideInRight {
  --animate-duration: 0.2s;
}
.animate__slideOutLeft {
  --animate-duration: 0.2s;
}
/* Sinon les boutons en haut à droite dans toolbar sont partiellement masqués à droite par 
un élément qui apparaît quand le drawer est caché*/
.q-drawer__opener { z-index: 1 !important }
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
