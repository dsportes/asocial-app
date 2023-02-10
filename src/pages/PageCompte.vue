<template>
  <q-page class="column q-pl-xs q-mr-sm">
    <info-restriction :niveau="3" cnx/>

    <div class="row items-center justify-center q-py-sm q-gutter-lg">
      <div> <!-- Changement de phrase secrète -->
        <q-btn class="q-ml-sm" size="md" icon="manage_accounts" no-caps
          :label="$t('CPTchps')" color="warning" dense @click="ouvrirchgps"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div v-if="session.compte.estParrain"> <!-- Parrainer un nouveau compte -->
        <q-btn class="q-ml-sm" size="md" icon="person_add" no-caps
          :label="$t('P10nvp')" color="warning" dense @click="ouvrirParrainage"/>
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
      <q-btn icon="open_in_new" size="sm" color="primary" @click="mcedit = true"/>
    </div>

    <!-- Avatars du compte -->
    <div v-for="(na, idx) in compte.lstAvatarNas" :key="na.id">
      <q-separator class="q-my-sm"/>
      <div class="row items-start">
        <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
          :color="na.id === session.avatarId ? 'warning' : 'primary'" @click="courant(na.id)"/>
        <fiche-avatar edit :class="'col ' + (na.id === session.avatarId ? 'courant' : 'zone')" :na="na" :idx="idx"/>
      </div>
    </div>

    <!-- Dialogue d'édition des mots clés du compte -->
    <q-dialog v-model="mcedit">
      <q-card class="petitelargeur shadow-8">
        <q-toolbar class="bg-secondary text-white">
          <q-toolbar-title class="titre-lg full-width">{{$t('CPTkwc')}}</q-toolbar-title>
          <q-btn dense flat size="md" icon="close" @click="mcedit=false"/>
        </q-toolbar>
      <mots-cles class="full-width" :motscles="motscles" @ok="okmc"></mots-cles>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'édition du mémo du compte -->
    <q-dialog v-model="memoedit">
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
    <q-dialog v-model="chgps">
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
      <nouveau-parrainage :close="fermerParrainage" />
    </q-dialog>

  </q-page>
</template>

<script>
import { reactive, ref } from 'vue'
import { encode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { crypter /*, decrypterStr */ } from '../app/webcrypto.mjs'
import { Motscles } from '../app/modele.mjs'
import { ChangementPS, MemoCompte, MotsclesCompte } from '../app/operations.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import InfoRestriction from '../components/InfoRestriction.vue'
import MotsCles from '../components/MotsCles.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import FicheAvatar from '../components/FicheAvatar.vue'
import NouveauParrainage from '../dialogues/NouveauParrainage.vue'

export default {
  name: 'PageCompte',

  components: { NouveauParrainage, BoutonHelp, FicheAvatar, PhraseSecrete, EditeurMd, ShowHtml, InfoRestriction, MotsCles },

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
    }
  },

  methods: {
    async ouvrirchgps () { 
      if (await this.session.aut(4, true)) { this.chgps = true; this.ps = null }
    },
    okps (ps) { this.ps = ps },
    async changerps () {
      await new ChangementPS().run(this.ps)
      this.ps = null
      this.chgps = false
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
      if (!await this.session.aut(3, true)) return
      const mck = await crypter(this.session.clek, new Uint8Array(encode(mmc)))
      await new MotsclesCompte().run(mck)
    },

    ouvrirParrainage () { this.nvpar = true },
    fermerParrainage() { this.nvpar = false }
  },

  setup () {
    const session = stores.session
    const compte = session.compte
    const mc = reactive({ categs: new Map(), lcategs: [], st: { enedition: false, modifie: false } })
    const motscles = new Motscles(mc, 1)
    const memoed = ref(null)

    return {
      ui: stores.ui,
      session,
      motscles,
      memoed,
      compte
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
