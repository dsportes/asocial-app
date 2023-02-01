<template>
  <q-page class="q-pa-xs column">
    <info-restriction :niveau="3" cnx/>
    <div class="titre-lg text-center">{{$t('P10tit')}}<span class="q-ml-md fs-sm font-mono">[{{session.compte.id}}]</span></div>

    <div class="column items-center q-py-sm q-gutter-xs">
      <div>
        <q-btn class="q-ml-sm" size="md" icon="manage_accounts" no-caps
          :label="$t('CPTchps')" color="warning" dense @click="ouvrirchgps"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
    </div>

    <div v-if="session.compte.estParrain" class="column items-center q-py-sm q-gutter-xs">
      <div>
        <q-btn class="q-ml-sm" size="md" icon="person_add" no-caps
          :label="$t('P10nvp')" color="warning" dense @click="ouvrirParrainage"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
    </div>

    <q-separator/>

    <div v-if="!session.compte.estComptable" class="q-py-md">
      <div class="row justify-between">
        <div class="titre-md">{{$t('CPTaptrib', [session.compte.nat.nom])}}</div>
        <q-btn flat dense size="sm" icon="chevron_right" @click="ouvrirtribu"/>
      </div>
      <div v-if="session.compte.estParrain" class="q-ml-sm titre-md text-warning text-bold">({{$t('P10cep')}})</div>
    </div>

    <div v-if="!session.compte.estComptable && !session.compte.estParrain"
      class="titre-md q-py-sm">{{$t('CPTimptrib', [session.compte.nat.nom])}}</div>

    <div v-if="session.auts(4)" class="q-py-sm">
      <div class="titre-md">{{$t('CPTmemo')}}</div>
      <show-html v-if="mx" class="q-ml-lg bord" maxh="5rem" :texte="session.prefs.memo" zoom
        :edit="session.auts(3, true)" @edit="memoeditAut"/>
      <div v-else class="q-ml-lg row">
        <div class="col fs-md text-italic">({{$t('CPTnomemo')}})</div>
        <q-btn class="col-auto" size="xs" dense icon="edit" color="primary" @click="memoeditAut"/>
      </div>
    </div>

    <div v-if="session.auts(4)">
      <div class="titre-md q-pt-md q-pb-sm">{{$t('CPTkwc')}}</div>
      <mots-cles class="full-width" :motscles="motscles" @ok="okmc"></mots-cles>
    </div>

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

  <q-dialog v-model="tribudial" full-height position="right">
    <q-card class="petitelargeur">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width">{{$t('CPTaptrib', [session.tribu.nom])}}</q-toolbar-title>
        <q-btn dense size="md" color="warning" icon="chevron_right" @click="tribudial=false"/>
      </q-toolbar>
      <q-card-section class="q-pa-sm fs-md" v-if="session.compte.estParrain">
        <div class="q-my-sm titre-lg">{{$t('P10nbc', session.tribu.nbc, {count: session.tribu.nbc})}}</div>
        <div class="q-my-sm">{{$t('CPTfda')}}</div>
        <div class="q-ml-md font-mono">V1 : {{session.tribu.f1}}<span class="q-ml-lg">{{ed1(session.tribu.f1)}}</span></div>
        <div class="q-ml-md font-mono">V2 : {{session.tribu.f2}}<span class="q-ml-lg">{{ed2(session.tribu.f2)}}</span></div>
        <div class="q-my-sm">{{$t('CPTrd')}}</div>
        <div class="q-ml-md font-mono">V1 : {{session.tribu.r1}}<span class="q-ml-lg">{{ed1(session.tribu.r1)}}</span></div>
        <div class="q-ml-md font-mono">V2 : {{session.tribu.r2}}<span class="q-ml-lg">{{ed2(session.tribu.r2)}}</span></div>
      </q-card-section>
      <q-separator/>
      <q-card-section class="q-pa-sm" >
        <div v-if="session.compte.estParrain">
          <div class="q-ml-sm titre-lg text-warning text-bold">({{$t('P10cep')}})</div>
          <div class="titre-lg text-bold q-mb-sm">
            {{$t('P10par2',parrains.length,{count:parrains.length} )}}
          </div>
        </div>
        <div v-else class="titre-lg text-bold q-mb-sm">
            {{$t('P10par1',parrains.length,{count:parrains.length} )}}
        </div>
        <fiche-people v-for="p in parrains" :key="p.na.id" :people="p" />
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="memoedit">
    <q-card class="petitelargeur shadow-8">
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title class="titre-lg full-width">{{$t('CPTmdc')}}</q-toolbar-title>
        <q-btn dense flat size="md" icon="close" @click="memoedit=false"/>
      </q-toolbar>
      <editeur-md ref="memoed" class="height-10"
        :texte="session.prefs.memo" editable modetxt :label-ok="$t('OK')" @ok="memook"/>
    </q-card>
  </q-dialog>

  <q-dialog v-model="nvpar" persistent class="moyennelargeur">
    <nouveau-parrainage :close="fermerParrainage" />
  </q-dialog>

  </q-page>
</template>

<script>
import { reactive, ref } from 'vue'
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { crypter } from '../app/webcrypto.mjs'
import { edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { Motscles } from '../app/modele.mjs'
import { ChangementPS, PrefCompte } from '../app/operations.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import EditeurMd from '../components/EditeurMd.vue'
import FichePeople from '../components/FichePeople.vue'
import ShowHtml from '../components/ShowHtml.vue'
import InfoRestriction from '../components/InfoRestriction.vue'
import MotsCles from '../components/MotsCles.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import NouveauParrainage from '../dialogues/NouveauParrainage.vue'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Page10',

  components: { NouveauParrainage, BoutonHelp, PhraseSecrete, EditeurMd, FichePeople, ShowHtml, InfoRestriction, MotsCles },

  computed: {
    mx () { return this.session.prefs.memo },
    parrains () { const lst = []
      this.people.getParrains.forEach(id => { lst.push(this.people.getPeople(id)) })
      return lst
    }
  },

  data () {
    return {
      chgps: false,
      ps: null,
      nvpar: false,
      memoedit: false,
      tribudial: false,
      mcledit: false
    }
  },

  methods: {
    ed (v) { return edvol(v) },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },

    async ouvrirchgps () { 
      if (await this.session.aut(4, true)) { this.chgps = true; this.ps = null }
    },
    okps (ps) {
      this.ps = ps
    },
    async changerps () {
      await new ChangementPS().run(this.ps)
      this.ps = null
      this.chgps = false
    },

    async memoeditAut () { if (await this.session.aut(3, true)) this.memoedit = true },
    async memook (m) {
      this.memoed.undo()
      const datak = await crypter(this.session.clek, new Uint8Array(encode(m)))
      await new PrefCompte().run('mp', datak)
      this.memoedit = false
    },

    async ouvrirtribu () {
      if (await this.session.aut(4)) this.tribudial = true
    },

    async mcleditAut () { if (await this.session.aut(3, true)) this.mcledit = true },
    async okmc (mmc) {
      if (!await this.session.aut(3, true)) return
      const datak = await crypter(this.session.clek, new Uint8Array(encode(mmc)))
      await new PrefCompte().run('mc', datak)
    },

    ouvrirParrainage () { this.nvpar = true },
    fermerParrainage() { this.nvpar = false }
  },

  setup () {
    const mc = reactive({ categs: new Map(), lcategs: [], st: { enedition: false, modifie: false } })
    const motscles = new Motscles(mc, 1)
    const memoed = ref(null)

    return {
      session: stores.session,
      avatar: stores.avatar,
      people: stores.people,
      motscles,
      memoed
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-bottom:  1px solid $grey-5
  border-top:  1px solid $grey-5
</style>
