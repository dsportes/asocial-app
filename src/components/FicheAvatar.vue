<template>
  <q-card :class="'row items-start ' + dkli(idx)">
    <info-restriction :niveau="3" cnx/>

    <div class="col-auto column items-center q-mr-sm">
      <img class="photomax" :src="avatar.na.photoDef" />
    </div>
    <div class="col">
      <div>
        <span class="text-bold fs-md q-mr-sm">{{na.nomc}}</span> 
        <span class="text-bold fs-sm font-mono q-mr-sm">#{{na.id}}</span> 
      </div>
      <show-html v-if="info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="4rem" :texte="info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
      <q-btn class="q-my-xs" flat size="sm" :label="$t('CVedit')" icon="edit" dense color="primary" @click="editerCV"/>
      <div class="q-mt-sm" v-if="avatar.pc">
        <div>
          <span class="titre-md text-italic">{{$t('FApc')}}</span>
          <q-btn class="q-ml-lg" dense flat color="primary" size="sm" :label="$t('FApcms')" @click="editerpc"/>
         </div>
        <div class="q-ml-lg font-mono fs-md text-bold">[{{avatar.pc}}]</div>
      </div>
      <div v-else>
        <span class="titre-md text-italic">{{$t('FAnpc')}}</span>
        <q-btn class="q-ml-sm" dense flat color="primary" size="sm" :label="$t('FAdeclpc')" @click="editerpc"/>
      </div>
    </div>

    <!-- Dialogue d'édition de la carte de visite -->
    <q-dialog v-model="edition">
      <carte-visite :photo-init="na.photo" :info-init="na.info" :na="na"
        :close="closeCV" @ok="cvchangee"/>
    </q-dialog>

    <!-- Dialogue d'édition de la phrase de contact -->
    <q-dialog v-model="editionpc">
      <q-card class="q-ma-xs moyennelargeur fs-md">
        <q-toolbar class="bg-secondary text-white">
          <bouton-help page="page1"/>
          <q-toolbar-title class="titre-lg q-pl-sm">{{$t('FAphc')}}</q-toolbar-title>
          <q-btn dense size="md" color="warning" icon="close" @click="editionpc = false"/>
        </q-toolbar>
        <q-card-section>
          <q-input dense v-model="pc" :label="$t('NPphl')" counter :rules="[r1]" maxlength="32"
            :type="isPwd ? 'password' : 'text'">
            <template v-slot:append>
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
              <span :class="pc.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="razphrase"/></span>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions vertical>
          <q-btn v-if="avatar.pc" flat color="warning" :label="$t('FAsup')" v-close-popup @click="supprPC"/>
          <q-btn :disable="r1(pc) !== true" flat color="primary" :label="$t('FAdpc')" v-close-popup @click="declPC"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import CarteVisite from '../components/CarteVisite.vue'
import { MajCv, GetAvatarPC, ChangementPC } from '../app/operations.mjs'
import InfoRestriction from '../components/InfoRestriction.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { afficherDiag } from '../app/util.mjs'
import { PhraseContact } from '../app/modele.mjs'

export default {
  name: 'FicheAvatar',

  props: { na: Object, idx: Number, edit: Boolean },

  components: { ShowHtml, CarteVisite, InfoRestriction, BoutonHelp },

  computed: {
    info () { return this.na.info }
  },

  data () {
    return {
      edition: false,
      editionpc: false,
      pc: '',
      isPwd: false
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    r1 (val) { return (val.length > 15 && val.length < 33) || this.$t('NP16') },
    async editerCV () { if (await this.session.aut(3, true)) this.edition = true },
    closeCV () { this.edition = false },
    async cvchangee (res) {
      if (res && this.na) {
        await new MajCv().run(this.avatar, res.ph, res.info)
      }
    },
    razphrase () { this.pc = '' },
    editerpc () {
      this.editionpc = true
      this.pc = this.avatar.pc || ''
    },
    async declPC () {
      const p = await new PhraseContact().init(this.pc)
      const { id, na } = await new GetAvatarPC().run(p)
      if (id) {
        if (id === this.avatar.id && na) {
          afficherDiag(this.$t('FAerr1')) // déjà celle de l'avatar
          return
        }
        if (id !== this.avatar.id && na) {
          afficherDiag(this.$t('FAerr2')) // déjà exactement utilisée par un autre avatar
          return
        }
        afficherDiag(this.$t('FAerr3')) // trop proche d'une déjà utilisée par un autre avatar
        return
      }
      await new ChangementPC().run(this.avatar.na, p)
    },
    async supprPC () {
      await new ChangementPC().run(this.avatar.na)
    }
},

  setup (props) {
    const avStore = stores.avatar
    const av = toRef(props, 'na')
    const avatar = ref(avStore.getAvatar(av.value.id))
    // console.log(av.value.na.nom)
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar') {
          avatar.value = avStore.getAvatar(av.value.id)
        }
      })
    })

    return {
      avatar,
      session: stores.session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
</style>
