<template>
  <q-page class="column q-pl-xs q-mr-sm">

    <div class="row items-center justify-center q-py-sm q-gutter-lg">
      <div> <!-- Changement de phrase secrète -->
        <q-btn class="q-ml-sm" size="md" icon="manage_accounts" no-caps
          :label="$t('CPTchps')" color="warning" dense @click="ouvrirchgps"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div v-if="session.estSponsor"> <!-- Parrainer un nouveau compte -->
        <q-btn class="q-ml-sm" size="md" icon="person_add" no-caps
          :label="$t('P10nvp')" color="warning" dense @click="ouvrirSponsoring"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div> <!-- Nouvel avatar -->
        <q-btn class="q-ml-sm" size="md" icon="add" no-caps
          :label="$t('CPTnvav')" color="warning" dense @click="ouvrirNvav"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
    </div>

    <!-- Mémo du compte -->
    <div v-if="session.auts(4)" class="q-py-sm">
      <div class="titre-md">{{$t('CPTmemo')}}</div>
      <show-html v-if="memo" class="q-ml-lg bord" maxh="5rem" :texte="memo" zoom
        :edit="session.auts(3, true)" @edit="memoeditAut"/>
      <div v-else class="q-ml-lg row">
        <div class="col fs-md text-italic">({{$t('CPTnomemo')}})</div>
        <q-btn class="col-auto" size="sm" dense icon="edit" color="primary" @click="memoeditAut"/>
      </div>
    </div>

    <!-- Mots clés du compte -->
    <div v-if="session.auts(4)" class="row items-center q-my-sm">
      <div class="titre-md q-mr-md">{{$t('CPTkwc')}}</div>
      <q-btn icon="open_in_new" size="sm" color="primary" @click="mcleditAut"/>
    </div>

    <!-- Avatars du compte -->
    <div v-for="(na, idx) in avStore.compta.lstAvatarNas" :key="na.id">
      <q-separator class="q-my-sm"/>
      <div class="row items-start">
        <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
          :color="na.id === session.avatarId ? 'warning' : 'primary'" @click="courant(na.id)"/>
        <fiche-avatar edit :class="'col ' + (na.id === session.avatarId ? 'courant' : 'zone')" :na="na" :idx="idx"/>
      </div>
    </div>

    <!-- Dialogue d'édition des mots clés du compte -->
    <q-dialog v-model="mcledit" persistent>
      <mots-cles class="full-width" :duGroupe="0" @ok="okmc" :titre="$t('CPTkwc')"/>
    </q-dialog>

    <!-- Dialogue de création d'un nouvel avatar -->
    <q-dialog v-model="nvav" persistent>
      <q-card class="moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('CPTnvav2')}}</div>
        <nom-avatar icon-valider="check" verif :label-valider="$t('valider')" @ok-nom="oknomav" />
      </q-card>
    </q-dialog>

    <!-- Dialogue d'édition du mémo du compte -->
    <q-dialog v-model="memoedit" persistent>
      <q-card class="petitelargeur shadow-8">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('CPTmdc')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="memoedit=false"/>
        </q-toolbar>
        <editeur-md ref="memoed" class="height-10"
          :texte="session.compte.memo || ''" editable modetxt :label-ok="$t('OK')" @ok="memook"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de changement de la phrase secrète -->
    <q-dialog v-model="chgps" persistent>
      <q-card class="q-mt-lg petitelargeur">
        <q-card-section>
          <div class="titre-lg text-center q-ma-md">{{$t('CPTchps2')}}</div>
          <phrase-secrete class="q-ma-xs" v-on:ok-ps="okps" verif icon-valider="check" :label-valider="$t('continuer')"></phrase-secrete>
        </q-card-section>
        <q-card-actions>
          <q-btn dense :label="$t('renoncer')" color="primary" icon="close" v-close-popup/>
          <q-btn dense :disable="ps===null" :label="$t('CPTvcp')" color="warning" icon="check" v-close-popup @click="changerps"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <q-dialog v-model="nvpar" persistent class="moyennelargeur">
      <nouveau-sponsoring :close="fermerSponsoring" :tribu="session.tribu"/>
    </q-dialog>

  </q-page>
</template>

<script>
import { encode } from '@msgpack/msgpack'
import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import { crypter /*, decrypterStr */ } from '../app/webcrypto.mjs'
import { ChangementPS, MemoCompte, MotsclesCompte, NouvelAvatar } from '../app/operations.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import MotsCles from '../components/MotsCles.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import FicheAvatar from '../components/FicheAvatar.vue'
import NomAvatar from '../components/NomAvatar.vue'
import NouveauSponsoring from '../dialogues/NouveauSponsoring.vue'
import { afficherDiag } from '../app/util.mjs'

export default {
  name: 'PageCompte',

  components: { NomAvatar, NouveauSponsoring, BoutonHelp, FicheAvatar, PhraseSecrete, EditeurMd, ShowHtml, MotsCles },

  computed: {
    memo () { return this.session.compte.memo }
  },

  data () {
    return {
      chgps: false,
      ps: null,
      memoedit: false,
      mcledit: false,
      nvpar: false,
      mcedit: false,
      nvav: false,
      nomav: ''
    }
  },

  methods: {
    async ouvrirNvav () { 
      if (await this.session.aut(4, true)) { this.nvav = true; this.nomav = '' }
    },
    async ouvrirchgps () { 
      if (await this.session.aut(4, true)) { this.chgps = true; this.ps = null }
    },
    okps (ps) { this.ps = ps },
    async changerps () {
      await new ChangementPS().run(this.ps)
      this.ps = null
      this.chgps = false
    },

    courant (id) {
      this.session.setAvatarCourant(id)
    },

    async oknomav (nom) {
      if (!nom) { this.nvav = false; return }
      if (this.avStore.compta.avatarDeNom(nom)) {
        await afficherDiag(this.$t('CPTndc'))
        return
      }
      this.nvav = false
      await new NouvelAvatar().run(nom)
    },

    async memoeditAut () { if (await this.session.aut(3, true)) this.memoedit = true },
    async memook (m) {
      this.memoed.undo()
      const memok = await crypter(this.session.clek, m)
      // const z = await decrypterStr(this.session.clek, memok)
      await new MemoCompte().run(memok)
      this.memoedit = false
    },

    async mcleditAut () { if (await this.session.aut(3, true)) this.mcledit = true },
    async okmc (mmc) {
      this.mcledit = false
      if (mmc !== false) {
        const mck = await crypter(this.session.clek, new Uint8Array(encode(mmc)))
        await new MotsclesCompte().run(mck)
      }
    },

    async ouvrirSponsoring () { if (await this.session.aut(3, true)) this.nvpar = true },
    fermerSponsoring() { this.nvpar = false }
  },

  setup () {
    const session = stores.session
    const avStore = stores.avatar

    const memoed = ref(null)

    /*
    const lstAv = ref([])
    function setLstAv () {
      lstAv.value = avStore.compta.lstAvatarNas
    }
    stores.avatar.$onAction(({ name, args, after }) => {
      after((result) => { 
        if (name === 'setCompta') 
          setLstAv()
      })
    })
    setLstAv()
    */

    return {
      ui: stores.ui,
      avStore,
      session,
      memoed
      // lstAv
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 2px 4px !important
</style>
